import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface State {
  hasError: boolean;
  error?: Error;
  info?: string;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.setState({ info: info.componentStack ?? '' });
    // eslint-disable-next-line no-console
    console.warn('ErrorBoundary caught:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, info: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const e = this.state.error;
    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Mafiazo crashed</Text>
          <Text style={styles.subtitle}>
            Take a screenshot and share with the developer.
          </Text>

          <Text style={styles.section}>Message</Text>
          <Text style={styles.code}>{e?.message ?? 'Unknown error'}</Text>

          <Text style={styles.section}>Name</Text>
          <Text style={styles.code}>{e?.name ?? 'Error'}</Text>

          {e?.stack ? (
            <>
              <Text style={styles.section}>Stack</Text>
              <Text style={styles.code}>{e.stack}</Text>
            </>
          ) : null}

          {this.state.info ? (
            <>
              <Text style={styles.section}>Component stack</Text>
              <Text style={styles.code}>{this.state.info}</Text>
            </>
          ) : null}

          <Pressable onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.l, paddingBottom: spacing.xxl },
  title: {
    ...typography.h1,
    color: colors.mafia,
    marginTop: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.s,
  },
  section: {
    ...typography.micro,
    color: colors.cedar,
    marginTop: spacing.l,
    marginBottom: spacing.xs,
  },
  code: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.cedar,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: radius.m,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  buttonText: { ...typography.bodyBold, color: colors.text },
});
