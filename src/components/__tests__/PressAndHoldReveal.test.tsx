import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PressAndHoldReveal } from '../PressAndHoldReveal';

describe('PressAndHoldReveal', () => {
  it('does not call onReleased before press-in', () => {
    const onReleased = jest.fn();
    render(
      <PressAndHoldReveal prompt="Hold" onReleased={onReleased}>
        <Text>secret</Text>
      </PressAndHoldReveal>,
    );
    expect(onReleased).not.toHaveBeenCalled();
  });

  it('calls onReleased after press-in then press-out', () => {
    const onReleased = jest.fn();
    const { getByTestId } = render(
      <PressAndHoldReveal prompt="Hold" onReleased={onReleased}>
        <Text>secret</Text>
      </PressAndHoldReveal>,
    );
    const pressable = getByTestId('press-and-hold-reveal');
    fireEvent(pressable, 'pressIn');
    fireEvent(pressable, 'pressOut');
    expect(onReleased).toHaveBeenCalledTimes(1);
  });
});
