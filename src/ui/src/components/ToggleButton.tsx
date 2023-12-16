import {createSignal} from 'solid-js';

function ToggleButton(props: { isToggled?: boolean; onToggle: (arg0: boolean) => any, children: any }) {
  const [isToggled, setIsToggled] = createSignal(props.isToggled || false);


  const toggle = () => {
    setIsToggled(!isToggled())
    props.onToggle?.(isToggled());
  };

  return (
    <button type="button" role="switch" onClick={toggle}
            class={`${isToggled() ? "bg-blue-500 text-white" : "bg-white text-gray-900 ring-gray-300"} inline-flex w-full justify-center rounded-md px-3 py-1.5 text-sm  shadow-sm ring-1 ring-inset `}>
      {props.children}
    </button>
  )
}

export default ToggleButton;
