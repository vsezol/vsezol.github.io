import { Avatar, Circle, Divider } from '../../shared/ui';
import { CONTACT_LINK_GROUPS } from './contacts-links';
import { ContactsList } from './contacts-list';
import { Greeting } from './greeting';

export const WelcomeCard = () => {
  return (
    <div className="card p-6 bg-base-300 shadow-xl max-w-2xl">
      <div className="flex gap-4">
        <Circle color="rainbow" border="sm">
          <Circle color="base-300" border="xs">
            <Avatar
              src="/my-avatar.jpg"
              alt="My avatar"
              priority={true}
            ></Avatar>
          </Circle>
        </Circle>

        <div className="flex flex-col gap-1">
          <h2 className="card-title">Vsevolod Zolotov</h2>
          <p>
            <Greeting />
            <br />I am a Tech Lead Software Engineer focusing on responsive and
            high-availability applications.
          </p>
        </div>
      </div>

      <div className="card-actions justify-center pt-4 ">
        <ContactsList contacts={CONTACT_LINK_GROUPS.messenger} />
        <Divider />
        <ContactsList contacts={CONTACT_LINK_GROUPS.work} />
        <Divider />
        <ContactsList contacts={CONTACT_LINK_GROUPS.lifestyle} />
      </div>
    </div>
  );
};
