import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoteTracker } from '../VoteTracker';
import { Player } from '@/engine/stateMachine';

const player = (id: string, name: string): Player => ({
  id,
  name,
  color: '#ccc',
  role: 'police',
  alive: true,
  seat: 0,
  roundsSurvived: 0,
});

describe('VoteTracker', () => {
  it('renders alive players and reports selection', () => {
    const onSelect = jest.fn();
    const alive = [
      player('a', 'Alice'),
      player('b', 'Bob'),
    ];
    const { getByTestId } = render(
      <VoteTracker alive={alive} onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('vote-target-a'));
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});
