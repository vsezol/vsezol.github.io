import { Button, Group, Stack, Text } from '@mantine/core';
import { DatePicker, TimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { useState } from 'react';

interface Props {
  prompt: string;
  /** ISO datetime suggested by the agent, if any */
  prefillStart: string | null;
  durationMinutes: number;
  disabled: boolean;
  onApprove: (startIso: string) => void;
  onDecline: () => void;
}

export default function DateTimeWidget({
  prompt,
  prefillStart,
  durationMinutes,
  disabled,
  onApprove,
  onDecline,
}: Props) {
  const prefill = prefillStart ? dayjs(prefillStart) : null;
  const [date, setDate] = useState<string | null>(
    prefill ? prefill.format('YYYY-MM-DD') : null,
  );
  const [time, setTime] = useState<string>(
    prefill ? prefill.format('HH:mm') : '',
  );
  const ready = Boolean(date && time);

  return (
    <Stack gap="sm" className="widget-card">
      <Text size="sm">{prompt}</Text>
      <div className="widget-calendar">
        <DatePicker
          value={date}
          onChange={setDate}
          minDate={dayjs().format('YYYY-MM-DD')}
          size="sm"
        />
      </div>
      <TimePicker
        label="Time"
        value={time}
        onChange={setTime}
        withDropdown
        format="24h"
        minutesStep={5}
        disabled={disabled}
      />
      <Text size="xs" c="dimmed">
        Duration: {durationMinutes} min · your local time (
        {Intl.DateTimeFormat().resolvedOptions().timeZone})
      </Text>
      <Group grow>
        <Button
          color="teal"
          disabled={disabled || !ready}
          onClick={() => {
            const startIso = dayjs(`${date}T${time}`).format(
              'YYYY-MM-DDTHH:mm:ssZ',
            );
            onApprove(startIso);
          }}
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
