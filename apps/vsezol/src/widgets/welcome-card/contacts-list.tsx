import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip } from '../../shared/ui';
import { ContactLink } from './contacts-links';

interface ContactsListProps {
  contacts: ContactLink[];
}

export const ContactsList = ({ contacts }: ContactsListProps) => {
  return contacts.map((contact) => (
    <Tooltip
      text={contact.description}
      key={contact.link}
      disabled={contact.withText}
    >
      <a href={contact.link} target="_blank">
        <Button size="sm">
          <FontAwesomeIcon size="lg" icon={contact.icon} />
          {contact.withText && contact.description}
        </Button>
      </a>
    </Tooltip>
  ));
};
