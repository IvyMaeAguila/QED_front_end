import { Children, cloneElement, isValidElement, useId, useRef, useState, useCallback, useImperativeHandle, type ComponentProps, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: ReactNode; disabled: boolean; hidden: boolean };
function optionsFrom(children: ReactNode, disabled = false): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean; hidden?: boolean }>(child)) return [];
    if (child.type === "option") return [{ value: String(child.props.value ?? child.props.children ?? ""), label: child.props.children, disabled: disabled || Boolean(child.props.disabled), hidden: Boolean(child.props.hidden) }];
    return optionsFrom(child.props.children, disabled || Boolean(child.props.disabled));
  });
}

function nativeOptions(children: ReactNode): ReactNode {
 return Children.map(children, child => {
  if (!isValidElement<{children?: ReactNode; "aria-hidden"?: boolean}>(child)) return child;
  return child.type === "option" ? cloneElement(child, {"aria-hidden": true}) : cloneElement(child, {}, nativeOptions(child.props.children));
 });
}

/** A real form select with the Admin menu presentation, shared by all accounts. */
export function AccountSelect({ children, className = "", style, onPointerDown, onKeyDown, onChange, onFocus, onBlur, ref, ...props }: ComponentProps<"select">) {
  const id = useId();
  const native = useRef<HTMLSelectElement>(null);
  const root = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => native.current as HTMLSelectElement, []);
  const [uncontrolledValue, setUncontrolledValue] = useState(() => String(props.defaultValue ?? optionsFrom(children)[0]?.value ?? ""));
  const pointerFocus = useRef(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 176, maxHeight: 300, dark: false });
  const options = optionsFrom(children);
  const requestedValue = String(props.value ?? uncontrolledValue);
  const selected = options.find(option => option.value === requestedValue) ?? options[0];
  const selectedValue = selected?.value ?? "";
  const visible = options.filter(option => !option.hidden);

  const explicitDark = props["data-dropdown-dark" as keyof typeof props] === true;
  const updatePosition = useCallback(() => {
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(176, rect.width), window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const upwards = below < 160 && above > below;
    const maxHeight = Math.min(300, upwards ? above : below);
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), top: upwards ? Math.max(8, rect.top - Math.min(visible.length * 32 + 8, maxHeight) - 4) : rect.bottom + 4, width, maxHeight, dark: Boolean(root.current?.closest(".dark") || document.querySelector(".qed-account-ui.dark")) || explicitDark });
  }, [visible.length, explicitDark]);
  function show() {
    if (props.disabled) return;
    updatePosition();
    setActive(Math.max(0, visible.findIndex(option => option.value === selectedValue && !option.disabled)));
    setOpen(true);
  }
  function choose(option: Option) {
    if (!native.current || option.disabled) return;
    native.current.value = option.value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    native.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);
  useEffect(() => { menu.current?.querySelector(`[data-option-index="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active, open]);

  return <span ref={root} className={`account-select ${className}`} style={style} data-disabled={props.disabled || undefined} data-keyboard-focus={keyboardFocus || undefined}>
    <span className="account-select-value" aria-hidden="true"><span>{selected?.label}</span><ChevronDown size={13} className={open ? "rotate-180" : ""} /></span>
    <select {...props} ref={native} onChange={event => { setUncontrolledValue(event.target.value); onChange?.(event); }} className="account-select-native" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} aria-activedescendant={open ? `${id}-${active}` : undefined}
      onFocus={event => { if (!pointerFocus.current) setKeyboardFocus(true); onFocus?.(event); }}
      onBlur={event => { pointerFocus.current = false; setKeyboardFocus(false); onBlur?.(event); }}
      onPointerDown={event => { pointerFocus.current = true; setKeyboardFocus(false); onPointerDown?.(event); if (!event.defaultPrevented) { event.preventDefault(); native.current?.focus(); if (open) setOpen(false); else show(); } }}
      onKeyDown={event => {
        setKeyboardFocus(true); onKeyDown?.(event); if (event.defaultPrevented) return;
        if (event.key === "Escape" || event.key === "Tab") { setOpen(false); return; }
        if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          if (!open) { show(); return; }
          if (event.key === "Enter" || event.key === " ") { if (visible[active]) choose(visible[active]); return; }
          const direction = event.key === "ArrowUp" || event.key === "End" ? -1 : 1;
          let next = event.key === "Home" ? 0 : event.key === "End" ? visible.length - 1 : active + direction;
          while (next >= 0 && next < visible.length && visible[next].disabled) next += direction;
          if (next >= 0 && next < visible.length) setActive(next);
        } else if (event.key.length === 1) {
          const next = visible.findIndex(option => !option.disabled && String(option.label).toLowerCase().startsWith(event.key.toLowerCase()));
          if (next >= 0) { event.preventDefault(); if (!open) show(); setActive(next); }
        }
      }}
    >{nativeOptions(children)}</select>
    {open && !props.disabled && createPortal(<div ref={menu} id={id} role="listbox" aria-label={props["aria-label"]} className={`account-select-menu ${position.dark ? "dark" : ""}`} style={{ position: "fixed", zIndex: 10000, top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}>
      {visible.map((option, index) => <button key={`${option.value}-${index}`} id={`${id}-${index}`} data-option-index={index} type="button" role="option" tabIndex={-1} disabled={option.disabled} aria-selected={option.value === selectedValue} data-active={index === active} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}><span>{option.label}</span>{option.value === selectedValue && <Check size={14} />}</button>)}
    </div>, document.body)}
  </span>;
}
