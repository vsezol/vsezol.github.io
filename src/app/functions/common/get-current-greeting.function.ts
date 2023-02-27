import { isNil } from '@bimeister/utilities';

interface DayPart {
  from: number;
  to: number;
  name: string;
}

const dayParts: DayPart[] = [
  {
    from: 0,
    to: 4,
    name: 'night',
  },
  {
    from: 5,
    to: 11,
    name: 'morning',
  },
  {
    from: 12,
    to: 17,
    name: 'afternoon',
  },
  {
    from: 18,
    to: 24,
    name: 'evening',
  },
];

export function getCurrentGreeting(): string {
  const hour: number = new Date().getHours();

  const currentPart: DayPart | undefined = dayParts.find(
    (part: DayPart) => hour >= part.from && hour <= part.to
  );

  if (isNil(currentPart?.name)) {
    return 'Hello!';
  }

  return `Good ${currentPart?.name}!`;
}
