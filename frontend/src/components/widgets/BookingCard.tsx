import { Badge, Button, Divider, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

interface Props {
  message: string;
  meetUrl: string;
  start: string;
  end: string;
  email: string;
}

export default function BookingCard({
  message,
  meetUrl,
  start,
  end,
  email,
}: Props) {
  const startAt = dayjs(start);
  const endAt = dayjs(end);

  return (
    <Stack gap="sm" className="widget-card booking-card">
      <Badge color="teal" variant="light" size="lg">
        ✅ Meeting booked
      </Badge>
      <Text size="sm">{message}</Text>
      <Divider />
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          {startAt.format('dddd, MMMM D, YYYY')}
        </Text>
        <Text size="sm">
          🕐 {startAt.format('HH:mm')} – {endAt.format('HH:mm')} (
          {Intl.DateTimeFormat().resolvedOptions().timeZone})
        </Text>
        <Text size="sm">✉️ Invitation sent to {email}</Text>
      </Stack>
      <Button component="a" href={meetUrl} target="_blank" rel="noreferrer" fullWidth>
        Join Google Meet
      </Button>
      <Text size="xs" c="dimmed">
        A calendar invitation with this link is on its way to your inbox.
      </Text>
    </Stack>
  );
}
