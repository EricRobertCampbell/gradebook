export type NamedPerson = {
  firstName: string;
  lastName: string;
  preferredName: string;
};

export function personDisplayName(person: NamedPerson): string {
  if (person.preferredName) {
    return person.preferredName;
  }

  return person.firstName;
}

export function personFullName(person: NamedPerson): string {
  return `${person.firstName} ${person.lastName}`;
}

export function personDistinctFullName(person: NamedPerson): string | null {
  const fullName = personFullName(person);
  return fullName === personDisplayName(person) ? null : fullName;
}
