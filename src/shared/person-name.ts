export type NamedPerson = {
  firstName: string;
  lastName: string;
  preferredName: string;
};

export function personDisplayName(person: NamedPerson): string {
  if (person.preferredName) {
    return person.preferredName;
  }

  return `${person.firstName} ${person.lastName}`;
}

export function personFullName(person: NamedPerson): string {
  return `${person.firstName} ${person.lastName}`;
}
