import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button, Tooltip } from '../../shared/ui';
import { CONTACT_LINKS } from './contacts-links';

export const WelcomeCard = () => {
  return (
    <div className="card p-6 bg-neutral shadow-xl max-w-2xl">
      <div className="flex gap-4">
        <Avatar src="/my-avatar.jpg" alt="My avatar" priority={true}></Avatar>

        <div>
          <h2 className="card-title">Vsevolod Zolotov</h2>
          <p>
            Good afternoon! I am a Tech Lead Software Engineer focusing on
            responsive and high-availability applications.
          </p>
        </div>
      </div>

      <div className="card-actions justify-center">
        {CONTACT_LINKS.flatMap((contacts) => contacts).map((contact) => (
          <Tooltip
            text={contact.description}
            key={contact.link}
            disabled={contact.withText}
          >
            <Button size="sm">
              <FontAwesomeIcon size="lg" icon={contact.icon} />
              {contact.withText && contact.description}
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
