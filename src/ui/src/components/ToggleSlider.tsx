import {createSignal} from 'solid-js';

function ToggleSlider(props: { isToggled?: boolean; onToggle: (arg0: boolean) => any }) {
  const [isToggled, setIsToggled] = createSignal(props.isToggled || false);


  const toggle = () => {
    setIsToggled(!isToggled())
    props.onToggle?.(isToggled());
  };

  return (
    <button type="button"
            class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isToggled() ? 'bg-blue-500' : 'bg-gray-200'}`}
            role="switch"
            onClick={toggle}>
      <span class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isToggled() ? 'translate-x-5' : 'translate-x-0'}`}></span>
    </button>
  )
}

export default ToggleSlider;
