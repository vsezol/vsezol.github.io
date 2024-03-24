import { config, library } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import {
  faGithub,
  faInstagram,
  faLinkedin,
  faTelegram,
  faVk,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faNewspaper } from '@fortawesome/free-solid-svg-icons';

config.autoAddCss = false;
library.add(
  faGithub,
  faVk,
  faInstagram,
  faEnvelope,
  faLinkedin,
  faNewspaper,
  faTelegram
);
