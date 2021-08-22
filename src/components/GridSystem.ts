import styled from '@emotion/styled';

export const Column = styled.div`
  float: left;
`;

export const Grid = styled.div`
  padding-left: 2rem;
  padding-right: 2rem;
  margin-left: auto;
  margin-right: auto;
  width: 100%;

  &:before,
  &:after {
    display: table;
    content: '';
  }

  &:after {
    clear: both;
  }
`;

export const PaddedGrid = styled(Grid)`
  @media screen and (min-width: 640px) {
    width: 608px;
  }
  @media screen and (min-width: 768px) {
    width: 768px;
  }
  @media screen and (min-width: 1024px) {
    width: 1024px;
  }
  @media screen and (min-width: 1080px) {
    width: 1080px;
  }
  @media screen and (min-width: 1280px) {
    width: 1280px;
  }
`;

export const RightColumn = styled.div`
  float: right;
`;
