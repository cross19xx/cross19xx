import React from 'react';
import styled from '@emotion/styled';

type Props = {
  children: string;
};

const SplitText: React.FC<Props> = ({ children }) => {
  return (
    <>
      {children.split(' ').map((word, index) => (
        <Text key={index}>{word}&nbsp;</Text>
      ))}
    </>
  );
};

const Text = styled.span`
  position: relative;
  display: inline-block;
`;

export default SplitText;
