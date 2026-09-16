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
};

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function bind(e: KeyboardEvent): keyof Omit<GameKeyState, "jumpPressed" | "retryPressed" | "dashPressed"> | null {
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
  return null;
}

export function createGameKeyboard() {
  const held: Omit<GameKeyState, "jumpPressed" | "retryPressed" | "dashPressed"> = {
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
    held[id] = true;
    if (id === "jump") jumpPressed = true;
    if (id === "retry") retryPressed = true;
    if (id === "dash") dashPressed = true;
  };
  const onUp = (e: KeyboardEvent) => {
    const id = bind(e);
    if (!id) return;
    held[id] = false;
  };
  const onBlur = () => {
    held.up = held.down = held.left = held.right = held.jump = held.dash = held.retry = held.pause = false;
  };

  window.addEventListener("keydown", onDown, true);
  window.addEventListener("keyup", onUp, true);
  window.addEventListener("blur", onBlur);

  return {
    read(): GameKeyState {
      const state: GameKeyState = {
        ...held,
        jumpPressed,
        retryPressed,
        dashPressed,
      };
      jumpPressed = false;
      retryPressed = false;
      dashPressed = false;
      if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gwinput")) {
        (window as Window & { __GW_KEYS__?: typeof held }).__GW_KEYS__ = { ...held };
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
