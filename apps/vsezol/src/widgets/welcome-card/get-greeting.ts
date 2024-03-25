interface GreetingData {
  hours: [number, number];
  name: string;
}

const dayParts: GreetingData[] = [
  {
    hours: [0, 4],
    name: 'night',
  },
  {
    hours: [5, 11],
    name: 'morning',
  },
  {
    hours: [12, 17],
    name: 'afternoon',
  },
  {
    hours: [18, 24],
    name: 'evening',
  },
];

export function getGreeting(): string {
  const hour: number = new Date().getHours();

  const currentPart: GreetingData | undefined = dayParts.find(
    ({ hours: [from, to] }: GreetingData) => hour >= from && hour <= to
  );

  if (!currentPart?.name) {
    return 'Hello!';
  }

  return `Good ${currentPart?.name}!`;
}
