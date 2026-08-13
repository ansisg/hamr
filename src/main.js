import { compress, decompress, initialize } from "./compress.js";
import {
  outputAlphabetASCII,
  outputAlphabetEmoji
} from "./alphabets.js";

var settings = {
  emoji: false,
  qr: false
};

const settingsElements = {
  emoji: "#settings-emoji",
};

for (const setting in settingsElements) {
  const element = document.querySelector(settingsElements[setting]);
  settings[setting] = element.checked;
  element.addEventListener("change", (event) => {
    settings[setting] = element.checked;
  });
}

const inputLinkElement = document.querySelector("#input-link");
const outputLinkElement = document.querySelector("#output-link");
const encodeButtonElement = document.querySelector("#encode-button");


async function updateOutput() {
  const input = inputLinkElement.value.trim();
  try {
    //console.log(`Encoding input: ${input}`);
    const alphabet = settings.emoji ? outputAlphabetEmoji : outputAlphabetASCII;
    const output = await compress(input, alphabet);
    //console.log(`Encoded output: ${output}`);
    outputLinkElement.textContent = `http://t.ha.mr#${output}`;
    outputLinkElement.href = `http://t.ha.mr#${output}`;
    outputLinkElement.style.color = "";
  } catch (e) {
    outputLinkElement.textContent = "Error: Could not encode input.";
    outputLinkElement.href = "#";
    outputLinkElement.style.color = "red";
  }
}
encodeButtonElement.addEventListener("click", updateOutput);

(async () => {
  await initialize();

  let payload = null;
  let alphabet = outputAlphabetASCII;

  // Get hash value of current address bar
  if (window.location.hash) {
    payload = decodeURIComponent(window.location.hash.slice(1));

    // Remove all whitespace
    payload = payload.replaceAll(" ", "");

    const useEmoji = Array.from(payload)
      .some(c => !outputAlphabetASCII.includes(c));

    alphabet = useEmoji
      ? outputAlphabetEmoji
      : outputAlphabetASCII;
  }

  if (payload && payload.trim()) {
    try {
      const target = await decompress(payload, alphabet);
      window.location.href = target;
      return;
    } catch (e) {
      console.warn("Redirect failed. Could not decode input.");
      console.error(e);
    }
  }

  document.querySelector("#content").style.opacity = 1;
  document.querySelector("#content").style.pointerEvents = "auto";
})();
