import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Timer, TimerHandle } from '../Timer';

jest.useFakeTimers();

describe('Timer', () => {
  it('counts down to zero and calls onElapsed once', () => {
    const onElapsed = jest.fn();
    render(<Timer durationSec={2} onElapsed={onElapsed} />);
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it('add() extends the time', () => {
    const ref = React.createRef<TimerHandle>();
    const onElapsed = jest.fn();
    render(<Timer ref={ref} durationSec={2} onElapsed={onElapsed} />);
    act(() => {
      ref.current?.add(5);
      jest.advanceTimersByTime(2500);
    });
    expect(onElapsed).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onElapsed).toHaveBeenCalled();
  });

  it('skip() forces elapsed', () => {
    const ref = React.createRef<TimerHandle>();
    const onElapsed = jest.fn();
    render(<Timer ref={ref} durationSec={60} onElapsed={onElapsed} />);
    act(() => {
      ref.current?.skip();
      jest.advanceTimersByTime(1100);
    });
    expect(onElapsed).toHaveBeenCalled();
  });

  it('pause() halts the countdown', () => {
    const ref = React.createRef<TimerHandle>();
    const onElapsed = jest.fn();
    render(<Timer ref={ref} durationSec={3} onElapsed={onElapsed} />);
    act(() => {
      ref.current?.pause();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onElapsed).not.toHaveBeenCalled();
  });
});
