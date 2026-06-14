---
title: 'iOS App Intents in an Expo app'
description: 'Learn how to bring Siri-powered App Intents into an Expo app by bridging JavaScript and Swift with Expo Modules, App Groups, and config plugins.'
lede: 'What happens when you want Siri to understand data that lives inside your Expo app? This article breaks down how I added iOS App Intents to a React Native/Expo project, from sharing dynamic data with Swift to wiring everything into the native iOS build.'
date: 2026-03-28
readingTime: 10
topic: Engineering
---

If you've ever used an Apple device with Siri installed, you've, at one point or another, used Siri (unless you haven't, then I tip my hat to you)

Commands as simple as "call my mum", or reminders as complex as "remind me to call my dad as soon as I get home" always result in an action — dialling your mum, or setting a reminder, respectively.

How does that happen? **App Intents**

(Almost) Every iOS app declares a collection of intents that are shipped with it. When you issue a command, Siri finds the app intent that matches it across all your apps and runs the associated Swift code. Optionally, some intents require the app to be opened (like in our examples, the phone app), and some do not (like the reminder app).

In all this, you'd realise one thing: the code is not in JavaScript. The intent has to be written in Swift.

## Let's get started

I'm going to assume you're already familiar with Expo and have a project set up. If not, the [Expo docs](https://docs.expo.dev/get-started/introduction/) are your friend. I'm also assuming that you're adopting a [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) approach to your Expo codebase

I'll be using an example from an app I built, called Howbee. (shameless plug, please join the beta testers [here](https://testflight.apple.com/join/qJBqKsad)). Its purpose is to help you check in on your friends and family by setting periodic or custom notifications.

It works by adding a contact (either from your contact list or a custom name) and one or more reminders.

I wanted Siri to respond when I asked to:

- Add a new contact
- Check in on a specific person
- Tell me who I need to catch up with

Using approaches like [native modules](https://docs.expo.dev/modules/native-module-tutorial/), you could easily achieve the first point. But then came the problem of options 2 and 3, which had to be dynamic. You can add contacts much later, and you'd still want Siri to have context on those contacts.

So the question became: **how do you get data from your JS app into Swift code that Siri can run — even when your app isn't open?**

The answer is a combination of three things:

1. An **Expo Module** that bridges JS and native code
2. **App Groups** for sharing data between your app and Siri
3. A **Config Plugin** that injects the Swift intent files into your Xcode project at prebuild time

Let's walk through each one.

## The big picture

Here's the flow at a glance:

```plaintext
React Native app
  → syncs contact data to shared UserDefaults (via Expo Module)
    → Siri reads that data at invocation time (via App Groups)
      → Intent either responds inline or deep links back into the app
```

Your JS code never runs when Siri is doing its thing. The Swift intents are completely standalone — they just happen to read from a shared data store that your app keeps up to date.

## Step 1: Create the Expo Module

First, scaffold a local Expo module. I called mine `howbee-intents`:

```bash
npx create-expo-module@latest --local howbee-intents
```

This gives you the standard structure — a Swift file (together with a Kotlin file for Android, but our focus is on the iOS part), a TypeScript declaration, and a config plugin entry point.

The native module's job is simple: read and write to a shared `UserDefaults` suite. That's it. It's a two-way key-value bridge.

```swift
// modules/howbee-intents/ios/HowbeeIntentsModule.swift

import ExpoModulesCore

public class HowbeeIntentsModule: Module {
    static let suiteName = "group.com.cross19xx.howbee"

    public func definition() -> ModuleDefinition {
        Name("HowbeeIntents")

        OnCreate {
            Self.updateShortcutParameters()
        }

        Function("getSharedData") { (key: String) -> String? in
            let defaults = UserDefaults(suiteName: HowbeeIntentsModule.suiteName)
            return defaults?.string(forKey: key)
        }

        Function("setSharedData") { (key: String, value: String) in
            let defaults = UserDefaults(suiteName: HowbeeIntentsModule.suiteName)
            defaults?.set(value, forKey: key)
            defaults?.synchronize()

            Self.updateShortcutParameters()
        }
    }

    private static func updateShortcutParameters() {
        guard let helperClass = NSClassFromString("HowbeeShortcutsHelper") as? NSObject.Type else {
            return
        }
        let selector = NSSelectorFromString("updateShortcutParameters")
        if helperClass.responds(to: selector) {
            helperClass.perform(selector)
        }
    }
}
```

A few things worth noting:

- The `suiteName` is an **App Group identifier**. It's what allows both the main app and the Siri process to access the same `UserDefaults`. More on this soon.
- `updateShortcutParameters()` tells Siri that the available parameters (i.e., your contacts list) have changed. Without this, Siri won't know about new contacts until the next system refresh.
- The method uses `NSClassFromString` to call a helper class that lives in the main app target. Why? Because the Expo module is compiled as a separate CocoaPods pod, and it can't directly import Swift types from the main app target. The Objective-C runtime lets us bridge that gap dynamically.

On the TypeScript side, the module declaration is straightforward:

```typescript
// modules/howbee-intents/src/HowbeeIntentsModule.ts

import { NativeModule, requireNativeModule } from 'expo';

declare class HowbeeIntentsModule extends NativeModule {
  getSharedData(key: string): string | null;
  setSharedData(key: string, value: string): void;
}

export default requireNativeModule<HowbeeIntentsModule>('HowbeeIntents');
```

## Step 2: Write the Swift intents

Now for the fun part — the actual App Intents. These are pure Swift structs that conform to the `AppIntent` protocol (iOS 16+). They can live anywhere in your directory, but following the convention used in expo modules (for example, `expo-camera`), it will be living inside a `plugin` directory inside the `modules/howbee-intents` directory. We'll be fleshing out the config plugin later, but now to the intents:

### The data layer

Before writing intents, we need a way for them to access contact data. Remember, when Siri runs your intent, your React Native app isn't running. The intents need their own way to read data.

```swift
// SharedContact.swift

struct SharedContact: Codable, Identifiable {
    let id: String
    let name: String
    let color: String
    let lastCheckin: String?
    let nextReminderDescription: String?
    let isOverdue: Bool
}
```

```swift
// SharedDataStore.swift

struct SharedDataStore {
    static let suiteName = "group.com.cross19xx.howbee"
    static let contactsKey = "siri_contacts"

    static func loadContacts() -> [SharedContact] {
        guard let defaults = UserDefaults(suiteName: suiteName),
              let jsonString = defaults.string(forKey: contactsKey),
              let data = jsonString.data(using: .utf8)
        else { return [] }

        let decoder = JSONDecoder()
        return (try? decoder.decode([SharedContact].self, from: data)) ?? []
    }
}
```

Same App Group suite name, same key. The JS side writes JSON, the Swift side reads it. Simple.

We also need a `ContactEntity` so Siri can present contacts as selectable parameters:

```swift
// ContactEntity.swift

struct ContactEntity: AppEntity {
    static var defaultQuery = ContactEntityQuery()
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Contact")

    var id: String
    var name: String

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }
}

struct ContactEntityQuery: EntityStringQuery {
    func entities(for identifiers: [String]) async throws -> [ContactEntity] {
        SharedDataStore.loadContacts()
            .filter { identifiers.contains($0.id) }
            .map { ContactEntity(id: $0.id, name: $0.name) }
    }

    func entities(matching string: String) async throws -> [ContactEntity] {
        let lowered = string.lowercased()
        return SharedDataStore.loadContacts()
            .filter { $0.name.lowercased().contains(lowered) }
            .map { ContactEntity(id: $0.id, name: $0.name) }
    }

    func suggestedEntities() async throws -> [ContactEntity] {
        SharedDataStore.loadContacts()
            .map { ContactEntity(id: $0.id, name: $0.name) }
    }
}
```

The `EntityStringQuery` protocol is what makes Siri smart about your data. When a user says "Check in with **Mum** in Howbee", Siri uses `entities(matching:)` to resolve "Mum" to a `ContactEntity`. And `suggestedEntities()` powers the autocomplete list when the user taps the parameter in the Shortcuts app.

### Intent 1: Add a new contact (the simple one)

This is the most straightforward intent — no parameters, just open the app:

```swift
struct AddNewContactIntent: AppIntent {
    static var title: LocalizedStringResource = "Add a new contact"
    static var description = IntentDescription("Add a new friend or family member to track")
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        guard let url = URL(string: "howbee://new-contact") else {
            return .result()
        }

        await MainActor.run {
            UIApplication.shared.open(url)
        }

        return .result()
    }
}
```

`openAppWhenRun = true` tells Siri to foreground the app. The intent then opens a deep link, and React Navigation handles the rest. No shared data needed.

### Intent 2: Check in with a contact (dynamic, opens app)

This one takes a `ContactEntity` parameter — meaning Siri will ask "Who?" and present the user with their contact list:

```swift
struct CheckInWithContactIntent: AppIntent {
    static var title: LocalizedStringResource = "Check in with contact"
    static var description = IntentDescription("Quick checkin with a friend or family member")
    static var openAppWhenRun = true

    @Parameter(title: "Contact")
    var contact: ContactEntity

    func perform() async throws -> some IntentResult {
        guard let encoded = contact.id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "howbee://checkin?contactId=\(encoded)")
        else {
            return .result()
        }

        await MainActor.run {
            UIApplication.shared.open(url)
        }

        return .result()
    }
}
```

The `@Parameter` property wrapper is what makes it dynamic. Siri resolves the contact using the `ContactEntityQuery` we defined earlier, then passes the selected entity to `perform()`. The intent constructs a deep link with the contact ID and opens the app to the check-in screen.

### Intent 3: Who should I catch up with? (dynamic, inline response)

This is the interesting one — it doesn't open the app at all. Siri responds directly with a list of overdue contacts:

```swift
struct WhoShouldICatchUpWithIntent: AppIntent {
    static var title: LocalizedStringResource = "Who should I catch up with?"
    static var description = IntentDescription("See friends who need attention")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let overdueContacts = SharedDataStore.loadContacts().filter { $0.isOverdue }

        if overdueContacts.isEmpty {
            return .result(value: "You're all caught up! No overdue check-ins.")
        }

        let names = overdueContacts.map(\.name).joined(separator: ", ")
        return .result(value: "You should catch up with: \(names)")
    }
}
```

No `openAppWhenRun`, no deep links. It reads from the shared data store and returns a string. Siri speaks it aloud and shows it on screen. This is where the App Groups setup really pays off — the intent is reading data that your React Native app wrote, without the app needing to be running.

### Registering with Siri

All three intents get registered via an `AppShortcutsProvider`:

```swift
struct HowbeeShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CheckInWithContactIntent(),
            phrases: [
                "Check in with \(\.$contact) in \(.applicationName)",
                "Catch up with \(\.$contact) in \(.applicationName)"
            ],
            shortTitle: "Check In",
            systemImageName: "person.wave.2"
        )

        AppShortcut(
            intent: WhoShouldICatchUpWithIntent(),
            phrases: [
                "Who should I catch up with in \(.applicationName)",
                "Who needs attention in \(.applicationName)"
            ],
            shortTitle: "Overdue Check-ins",
            systemImageName: "person.3"
        )

        AppShortcut(
            intent: AddNewContactIntent(),
            phrases: [
                "Add a new contact in \(.applicationName)",
                "Add a friend in \(.applicationName)"
            ],
            shortTitle: "Add Contact",
            systemImageName: "person.badge.plus"
        )
    }
}
```

The `phrases` array is what Siri listens for. Notice how `\(\.$contact)` interpolates the parameter — Siri will fill that slot with the entity the user specifies. And `\(.applicationName)` automatically resolves to your app's display name.

We also need a helper class so the Expo module can tell Siri to refresh its parameters:

```swift
@objc(HowbeeShortcutsHelper)
class HowbeeShortcutsHelper: NSObject {
    @objc static func updateShortcutParameters() {
        HowbeeShortcuts.updateAppShortcutParameters()
    }
}
```

This is the class that `NSClassFromString("HowbeeShortcutsHelper")` resolves to in the Expo module. The `@objc` annotation makes it visible to the Objective-C runtime.

## Step 3: Share data with App Groups

App Groups let multiple processes (your app, Siri, widgets, etc.) read and write to the same `UserDefaults` suite. You need two things:

1. The **entitlement** added to your app
2. Both sides using the **same suite name**

The entitlement is handled by the config plugin (next section), but the usage is what we've already seen — both `HowbeeIntentsModule.swift` and `SharedDataStore.swift` use `UserDefaults(suiteName: "group.com.cross19xx.howbee")`.

## Step 4: The Config Plugin

This is the glue that makes everything work with `expo prebuild`. Without it, your Swift intent files would just be sitting in a folder, not compiled into the app.

The plugin does two things:

### 1. Add the App Group entitlement

```typescript
// plugin/src/with-app-group-entitlement.ts

import { type ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

const APP_GROUP_ID = 'group.com.cross19xx.howbee';

export const withAppGroupEntitlement: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (modifiedConfig) => {
    const entitlements = modifiedConfig.modResults;

    if (!entitlements['com.apple.security.application-groups']) {
      entitlements['com.apple.security.application-groups'] = [];
    }

    const groups = entitlements['com.apple.security.application-groups'] as string[];
    if (!groups.includes(APP_GROUP_ID)) {
      groups.push(APP_GROUP_ID);
    }

    return modifiedConfig;
  });
};
```

### 2. Copy Swift files into the Xcode project and add them to the build target

This is the trickier part. The Swift files need to be:

- Physically copied into the `ios/` directory
- Added to the Xcode project as source files so they get compiled

```typescript
// plugin/src/with-app-intents.ts

import { type ConfigPlugin, withDangerousMod, withXcodeProject } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const SWIFT_FILES: string[] = [
  'Models/SharedContact.swift',
  'Models/SharedDataStore.swift',
  'Entities/ContactEntity.swift',
  'AppIntents/CheckInWithContactIntent.swift',
  'AppIntents/WhoShouldICatchUpWithIntent.swift',
  'AppIntents/AddNewContactIntent.swift',
  'AppIntents/HowbeeShortcuts.swift',
];

const INTENTS_GROUP_NAME = 'HowbeeIntents';

export const withAppIntents: ConfigPlugin = (config) => {
  // Step 1: Copy Swift files into the iOS project
  config = withDangerousMod(config, [
    'ios',
    (dangerousConfig) => {
      const projectName = dangerousConfig.modRequest.projectName!;
      const swiftSourceDir = path.join(__dirname, '..', 'swift');
      const targetDir = path.join(
        dangerousConfig.modRequest.projectRoot,
        'ios',
        projectName,
        INTENTS_GROUP_NAME,
      );

      fs.mkdirSync(targetDir, { recursive: true });

      for (const relativePath of SWIFT_FILES) {
        const source = path.join(swiftSourceDir, relativePath);
        const dest = path.join(targetDir, path.basename(relativePath));
        fs.copyFileSync(source, dest);
      }

      return dangerousConfig;
    },
  ]);

  // Step 2: Add Swift files to the Xcode project build sources
  config = withXcodeProject(config, (xcodeConfig) => {
    const project = xcodeConfig.modResults;
    const projectName = xcodeConfig.modRequest.projectName!;

    const groupPath = path.join(projectName, INTENTS_GROUP_NAME);
    let intentGroupId = project.pbxCreateGroup(INTENTS_GROUP_NAME, groupPath);
    const mainGroup = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(intentGroupId, mainGroup);

    for (const relativePath of SWIFT_FILES) {
      const fileName = path.basename(relativePath);
      project.addSourceFile(fileName, { target: project.getFirstTarget().uuid }, intentGroupId);
    }

    return xcodeConfig;
  });

  return config;
};
```

Why `withDangerousMod`? Because we're doing raw filesystem operations — copying files into the `ios/` directory. The Expo config plugin system doesn't have a built-in mod for "add arbitrary Swift files to the project", so we go dangerous.

Then `withXcodeProject` modifies the `.pbxproj` file to create a group and add the files as build sources. Without this step, Xcode wouldn't know the files exist.

Both plugins are chained together in the module's plugin entry point:

```typescript
// plugin/src/index.ts

import { type ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAppGroupEntitlement } from './with-app-group-entitlement';
import { withAppIntents } from './with-app-intents';

const withHowbeeIntents: ConfigPlugin = (config) => {
  config = withAppGroupEntitlement(config);
  config = withAppIntents(config);
  return config;
};

export default createRunOncePlugin(withHowbeeIntents, 'howbee-intents', '1.0.0');
```

And registered in `app.config.ts`:

```typescript
plugins: [
  // ... other plugins
  './modules/howbee-intents/plugin/src/index',
],
```

## Step 5: Sync data from JS

The last piece of the puzzle — keeping the shared data store in sync with your app's actual data. I built a headless React component that subscribes to my Realm database and writes to the shared store whenever contacts change:

```typescript
// src/components/siri-sync-handler.tsx

import { useQuery } from '@realm/react';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Contact } from '_/db/schemas/contact.schema';
import * as HowbeeIntents from '_/modules/howbee-intents';

const HowbeeIntentsModule = HowbeeIntents.default;

const SiriSyncHandler: React.FC = () => {
  const contacts = useQuery(Contact);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const shared = contacts.map((contact) => ({
      id: contact.id.toString(),
      name: contact.name,
      color: contact.color,
      lastCheckin: contact.lastCheckin ?? null,
      nextReminderDescription: getNextReminderDescription(contact),
      isOverdue: isContactOverdue(contact),
    }));

    try {
      HowbeeIntentsModule.setSharedData('siri_contacts', JSON.stringify(shared));
    } catch (error) {
      console.debug('Failed to sync contacts to Siri', error);
    }
  }, [contacts]);

  return null;
};
```

Drop this component somewhere near the root of your app, and every time your contacts change, Siri's data store gets updated. The `setSharedData` call also triggers `updateShortcutParameters()` on the native side, so Siri immediately knows about new or removed contacts.

Your database doesn't have to be Realm — the pattern works the same with any data source. Just serialise your data to JSON and call `setSharedData`.

## Step 6: Handle deep links back

Two of our three intents open the app via deep links (`howbee://new-contact` and `howbee://checkin?contactId=...`). You'll need to handle those in your navigation config:

```typescript
// src/routing/linking.ts

import * as Linking from 'expo-linking';

export const linkingNavigationConfig = {
  prefixes: [Linking.createURL('/'), 'howbee://'],

  config: {
    screens: {
      checkin: 'checkin',
      'new-contact': 'new-contact',
    },
  },
};
```

That's standard React Navigation deep linking — nothing Siri-specific. The intents just happen to be the ones generating the URLs.

## The folder structure

For reference, here's what the module looks like:

```plaintext
modules/howbee-intents/
├── index.ts
├── expo-module.config.json
├── src/
│   ├── HowbeeIntentsModule.ts
│   └── HowbeeIntents.types.ts
├── ios/
│   └── HowbeeIntentsModule.swift      ← The Expo module (compiled as a pod)
├── plugin/
│   ├── src/
│   │   ├── index.ts                   ← Config plugin entry
│   │   ├── with-app-intents.ts        ← Copies Swift files + Xcode integration
│   │   └── with-app-group-entitlement.ts
│   └── swift/                          ← Swift files (copied into ios/ at prebuild)
│       ├── Models/
│       │   ├── SharedContact.swift
│       │   └── SharedDataStore.swift
│       ├── Entities/
│       │   └── ContactEntity.swift
│       └── AppIntents/
│           ├── AddNewContactIntent.swift
│           ├── CheckInWithContactIntent.swift
│           ├── WhoShouldICatchUpWithIntent.swift
│           └── HowbeeShortcuts.swift
└── android/
    └── ...                             ← No-op stub
```

## Gotchas and things I learnt

- **The Swift files must be in the main app target**, not in the Expo module's pod. App Intents only work when compiled as part of the main app. That's why we copy them during prebuild instead of putting them in the `ios/` folder of the module.
- **`NSClassFromString` is the bridge trick.** Because the Expo module is a separate pod, it can't `import` the `HowbeeShortcutsHelper` class directly. The ObjC runtime lookup is the cleanest way to call across that boundary.
- **Call `updateAppShortcutParameters()`** every time your data changes. If you don't, Siri will serve stale suggestions until the system refreshes on its own schedule (which can be hours).
- **App Group IDs must start with `group.`** and match exactly between your entitlement, your `UserDefaults(suiteName:)`, and your `SharedDataStore`. One typo and everything silently fails.
- **`@available(iOS 16, *)`** — App Intents require iOS 16+. If you support older versions, guard accordingly.

## Wrapping up

The mental model is actually pretty simple once you see it laid out:

1. Your JS app writes data to a shared store via the Expo module
2. Swift intents read that data when Siri invokes them
3. A config plugin handles all the Xcode wiring at prebuild time

The hardest part isn't the code — it's knowing that you need all three pieces and how they connect. Hopefully this saves you the hours I spent figuring that out.

If you want to see the full implementation, the code is from [Howbee](https://testflight.apple.com/join/qJBqKsad) — a little app for remembering to check in on the people you care about.
