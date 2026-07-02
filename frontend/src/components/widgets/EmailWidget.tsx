import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Props {
  prompt: string;
  prefill: string | null;
  disabled: boolean;
  onApprove: (email: string) => void;
  onDecline: () => void;
}

export default function EmailWidget({
  prompt,
  prefill,
  disabled,
  onApprove,
  onDecline,
}: Props) {
  const [email, setEmail] = useState(prefill ?? '');
  const [touched, setTouched] = useState(false);
  const valid = EMAIL_RE.test(email.trim());

  return (
    <Stack gap="sm" className="widget-card">
      <Text size="sm">{prompt}</Text>
      <TextInput
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        disabled={disabled}
        error={touched && !valid ? 'Enter a valid email' : undefined}
        onChange={(e) => {
          setEmail(e.currentTarget.value);
          setTouched(true);
        }}
      />
      <Group grow>
        <Button
          color="teal"
          disabled={disabled || !valid}
          onClick={() => onApprove(email.trim())}
        >
          Approve
        </Button>
        <Button
          variant="light"
          color="red"
          disabled={disabled}
          onClick={onDecline}
        >
          Decline
        </Button>
      </Group>
    </Stack>
  );
}
