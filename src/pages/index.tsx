import React from 'react';
import { NextPage } from 'next';
import styled from '@emotion/styled';

import AnimatedObject from '_/components/AnimatedObject';
import { Column, Grid, PaddedGrid } from '_/components/GridSystem';
import Logo from '_/components/Logo';
import SplitText from '_/components/SplitText';

const NETWORK = [
  { title: 'hello@nicolasdesle.be', link: 'mailto:hello@nicolasdesle.be' },
  { title: 'GitHub', link: 'https://www.github.com/cross19xx' },
  { title: 'Linkedin', link: 'https://www.linkedin.com/in/kenneth-kwakye-gyamfi' },
  { title: 'Facebook', link: 'https://www.facebook.com/profile.php?id=100009436144652' },
  { title: 'Instagram', link: 'https://www.instagram.com/kenneth_kwakyegyamfi' },
  { title: 'Twitter', link: 'https://twitter.com/cross19xx' },
];

const SKILLS = [
  'Cross Platform mobile app development',
  'Backend development',
  'Web development',
  'Native mobile app development',
  'Native watch & tvOS development',
  'Application wireframe designing',
  'Desktop application development',
];

const HomePage: NextPage = () => {
  return (
    <Container>
      <Header>
        <AnimatedObject>
          <StyledLogo size="4rem" />
        </AnimatedObject>
      </Header>

      <Intro>
        <Title>
          <AnimatedObject>
            <SplitText>Hi there. I&apos;m Kenneth.</SplitText>
          </AnimatedObject>
        </Title>

        <Subtitle>
          <AnimatedObject delay={0.2}>
            <SplitText>
              I&apos;m a full stack mobile and web developer based in Accra, Ghana.
            </SplitText>
          </AnimatedObject>
        </Subtitle>
      </Intro>

      <Main>
        <Section>
          <AnimatedObject>
            <SectionTitle>Skills &amp; Focus</SectionTitle>
            <SectionList>
              {SKILLS.map((skill) => (
                <SectionRow key={skill}>{skill}</SectionRow>
              ))}
            </SectionList>
          </AnimatedObject>
        </Section>

        <Section>
          <AnimatedObject>
            <SectionTitle>Network</SectionTitle>

            <SectionList>
              {NETWORK.map(({ title, link }) => (
                <SectionRow key={link}>
                  <SectionLink href={link}>{title}</SectionLink>
                </SectionRow>
              ))}
            </SectionList>
          </AnimatedObject>
        </Section>
      </Main>
    </Container>
  );
};

const Container = styled(PaddedGrid)`
  display: flex;
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 2rem;
  flex-direction: column;

  @media screen and (min-width: 640px) {
    padding-top: 5rem;
    padding-bottom: 2.5rem;
  }
`;

const Header = styled.nav`
  height: 5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`;

const StyledLogo = styled(Logo)`
  border-radius: 0.25rem;
`;

const Intro = styled.div`
  min-height: 25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`;

const Title = styled.h1`
  font-weight: normal;
  font-size: 2.25rem;
  letter-spacing: 2px;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.75rem;
  line-height: 1.5;
  color: var(--text-secondary);
`;

const Main = styled(Grid)`
  padding: 0;
`;

const Section = styled(Column)`
  width: 100%;
  margin-bottom: 2rem;

  @media screen and (min-width: 640px) {
    width: 50%;
    margin-bottom: 0;

    &:nth-of-type(even) {
      padding-left: 10rem;
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: normal;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 2px;
  margin-bottom: 1.5rem;
`;

const SectionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SectionRow = styled.li`
  margin-bottom: 1rem;
`;

const SectionLink = styled.a`
  display: inline-block;

  &:after {
    content: '';
    width: 0;
    height: 1px;
    display: block;
    position: relative;
    background: var(--text-primary);
    transition: width 175ms;
  }

  &:hover {
    &:after {
      width: 100%;
    }
  }
`;

export default HomePage;
