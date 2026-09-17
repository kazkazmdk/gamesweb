export type GameKeyState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  retry: boolean;
  pause: boolean;
  jumpPressed: boolean;
  retryPressed: boolean;
  dashPressed: boolean;
  onePressed: boolean;
  twoPressed: boolean;
  threePressed: boolean;
};

type Held = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  retry: boolean;
  pause: boolean;
};

type BindId = keyof Held | "one" | "two" | "three";

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function bind(e: KeyboardEvent): BindId | null {
  const code = e.code;
  const key = e.key.toLowerCase();
  if (code === "KeyW" || code === "ArrowUp" || key === "w" || key === "z") return "up";
  if (code === "KeyS" || code === "ArrowDown" || key === "s") return "down";
  if (code === "KeyA" || code === "ArrowLeft" || key === "a" || key === "q") return "left";
  if (code === "KeyD" || code === "ArrowRight" || key === "d") return "right";
  if (code === "Space" || key === " ") return "jump";
  if (code === "ShiftLeft" || code === "ShiftRight") return "dash";
  if (code === "KeyR" || key === "r") return "retry";
  if (code === "Escape") return "pause";
  if (code === "Digit1" || code === "Numpad1" || key === "1") return "one";
  if (code === "Digit2" || code === "Numpad2" || key === "2") return "two";
  if (code === "Digit3" || code === "Numpad3" || key === "3") return "three";
  return null;
}

export function createGameKeyboard() {
  const held: Held = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    retry: false,
    pause: false,
  };
  let jumpPressed = false;
  let retryPressed = false;
  let dashPressed = false;
  let onePressed = false;
  let twoPressed = false;
  let threePressed = false;

  const onDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      const id = bind(e);
      if (id && id !== "pause") e.preventDefault();
      return;
    }
    if (isTypingTarget(e.target)) return;
    const id = bind(e);
    if (!id) return;
    if (id !== "pause") e.preventDefault();
    if (id === "one") {
      onePressed = true;
      return;
    }
    if (id === "two") {
      twoPressed = true;
      return;
    }
    if (id === "three") {
      threePressed = true;
      return;
    }
    held[id] = true;
    if (id === "jump") jumpPressed = true;
    if (id === "retry") retryPressed = true;
    if (id === "dash") dashPressed = true;
  };
  const onUp = (e: KeyboardEvent) => {
    const id = bind(e);
    if (!id || id === "one" || id === "two" || id === "three") return;
    held[id] = false;
  };
  const onBlur = () => {
    held.up = held.down = held.left = held.right = held.jump = held.dash = held.retry = held.pause = false;
  };

  window.addEventListener("keydown", onDown, true);
  window.addEventListener("keyup", onUp, true);
  window.addEventListener("blur", onBlur);

  const snapshot = (): GameKeyState => ({
    ...held,
    jumpPressed,
    retryPressed,
    dashPressed,
    onePressed,
    twoPressed,
    threePressed,
  });

  return {
    /** Same as read() but keeps the one-frame pulses for a later read() in the same frame. */
    peek(): GameKeyState {
      return snapshot();
    },
    read(): GameKeyState {
      const state = snapshot();
      jumpPressed = false;
      retryPressed = false;
      dashPressed = false;
      onePressed = false;
      twoPressed = false;
      threePressed = false;
      if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gwinput")) {
        (window as Window & { __GW_KEYS__?: Held }).__GW_KEYS__ = { ...held };
      }
      return state;
    },
    driving() {
      return held.up || held.down || held.left || held.right || held.jump;
    },
    destroy() {
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
      window.removeEventListener("blur", onBlur);
      onBlur();
    },
  };
}

export type GameKeyboard = ReturnType<typeof createGameKeyboard>;
