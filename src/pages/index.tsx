import React from 'react';
import { NextPage } from 'next';
import styled from '@emotion/styled';

import { Column, Grid, PaddedGrid } from '_/components/GridSystem';
import Logo from '_/components/Logo';

const NETWORK = [
  { title: 'hello@nicolasdesle.be', link: 'mailto:hello@nicolasdesle.be' },
  { title: 'GitHub', link: 'https://www.github.com/cross19xx' },
  { title: 'Linkedin', link: 'https://www.linkedin.com/in/kenneth-kwakye-gyamfi' },
  { title: 'Facebook', link: 'Facebook' },
  { title: 'Instagram', link: 'Instagram' },
  { title: 'Twitter', link: 'Twitter' },
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
        <StyledLogo size="4rem" />
      </Header>

      <Intro>
        <Title>Hi there. I&apos;m Kenneth.</Title>
        <Subtitle>I&apos;m a full stack mobile and web developer based in Accra, Ghana.</Subtitle>
      </Intro>

      <Main>
        <Section>
          <SectionTitle>Skills &amp; Focus</SectionTitle>
          <SectionList>
            {SKILLS.map((skill) => (
              <SectionRow key={skill}>{skill}</SectionRow>
            ))}
          </SectionList>
        </Section>

        <Section>
          <SectionTitle>Network</SectionTitle>
          <SectionList>
            {NETWORK.map(({ title, link }) => (
              <SectionRow key={link}>
                <SectionLink href={link}>{title}</SectionLink>
              </SectionRow>
            ))}
          </SectionList>
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
  min-height: 27.5rem;
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
