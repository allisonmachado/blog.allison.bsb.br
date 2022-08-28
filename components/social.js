import Space from "./space";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";

export default function Social() {
  return (<div className="container">
    <div className="row">
      <div className="one-third column">
        <a href="https://www.linkedin.com/in/allisonmachado/">
          <FontAwesomeIcon
            icon={faLinkedin}
          />
          <span>/in/allisonmachado/ <Space /></span>
        </a>
      </div>
      <div className="one-third column">
        <a href="https://github.com/allisonmachado">
          <FontAwesomeIcon
            icon={faGithub}
          />
          <span>/allisonmachado/ <Space /></span>
        </a>
      </div>
      <div className="one-third column">
        <a href="https://twitter.com/allisonmachado_">
          <FontAwesomeIcon
            icon={faTwitter}
          />
          <span>@allisonmachado_ <Space /></span>
        </a>
      </div>
    </div>
  </div>)
}
