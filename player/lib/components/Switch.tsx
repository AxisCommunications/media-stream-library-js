import React, { ChangeEventHandler } from 'react'
import styled from 'styled-components'

const Container = styled.label`
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
`

const Input = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`

const Slider = styled.span`
  border-radius: 16px;
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #ccc;
  transition: 0.4s;

  &:before {
    border-radius: 50%;
    content: '';
    position: absolute;
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
  }

  ${Input}:checked + & {
    background-color: #2196f3;
  }

  ${Input}:checked + &:before {
    transform: translateX(12px);
  }

  ${Input}:focus + & {
    box-shadow: 0 0 1px #2196f3;
  }
`

export interface SwitchProps {
  readonly name?: string
  readonly checked: boolean
  readonly onChange: ChangeEventHandler<HTMLInputElement>
}

export const Switch: React.FC<SwitchProps> = (props) => {
  return (
    <Container>
      <Input type="checkbox" {...props} />
      <Slider />
    </Container>
  )
}
