import {createSignal, For, onCleanup, onMount} from "solid-js";
import ToggleSlider from "./ToggleSlider.tsx";
import ToggleButton from "./ToggleButton.tsx";
import {useSettings} from '../contexts/SettingsContext.tsx';

/**
 * SettingsModal component.
 * This component provides a modal for the user to change various settings.
 *
 * @param {Object} props - The properties passed to the component.
 */
function SettingsModal(props) {
  // Use the settings from the SettingsContext
  const {
    selectedStaves: [selectedStaves, setSelectedStaves],
    scoreScale: [scoreScale, setScoreScale],
    colorizeBottomSystem: [colorizeBottomSystem, setColorizeBottomSystem],
    smartScroll: [smartScroll, setSmartScroll],
    scrollPercentage: [scrollPercentage, setScrollPercentage],
    showSeparator: [showSeparator, setShowSeparator],
    smoothScrolling: [smoothScrolling, setSmoothScrolling]
  } = useSettings();

  // Create signals for the score scale and scroll percentage
  const [scaleValue, setScaleValue] = createSignal(scoreScale());
  const [scrollValue, setScrollValue] = createSignal(scrollPercentage());

  const [modalRef, setModalRef] = createSignal<HTMLDivElement | null>(null);


  function handleStaffToggle(staffNum: number, isToggled: boolean) {
    let newSelectedStaves = [...selectedStaves()];

    if (isToggled) {
      newSelectedStaves.push(staffNum);
    } else {
      newSelectedStaves = newSelectedStaves.filter(num => num !== staffNum);
    }

    newSelectedStaves.sort((a, b) => a - b);
    setSelectedStaves(newSelectedStaves);
  }

  function handleScoreScaleChange(e) {
    setScoreScale(parseInt(e.target.value, 10));
  }

  function handleShowSeparatorChange(isToggled: boolean) {
    setShowSeparator(isToggled);
  }

  function handleColorizeBottomSystemChange(isToggled: boolean) {
    setColorizeBottomSystem(isToggled);
  }

  function handleSmoothScrollingChange(isToggled: boolean) {
    setSmoothScrolling(isToggled);
  }

  function handleSmartScrollChange(isToggled: boolean) {
    setSmartScroll(isToggled);
  }

  function handleScrollSizeChange(e) {
    setScrollPercentage(parseInt(e.target.value, 10));
  }

  function handleClickOutside(e: MouseEvent) {
    const modal = modalRef();
    if (modal && !modal.contains(e.target as Node)) {
      props.onClose();
    }
  }


  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <>
      <div class="ease-in-out duration-300 relative z-10" role="dialog">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div ref={setModalRef} class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div class={`bg-gradient-to-r ${props.isConnected ? "from-blue-600 to-blue-500" : "from-red-600 to-red-500"} text-white text-xl font-bold pl-4 pr-2 py-2 flex flex-row items-center justify-stretch`}>
                <div class="grow">
                  FlowScore
                </div>
                <button type="button" class={`inline-flex justify-center bg-white hover:bg-gray-100 text-gray-900 ring-gray-300 ring-1 ring-inset rounded-md px-3 py-2 text-sm font-semibold shadow-sm ml-3 w-auto`} onClick={props.onClear}>Clear</button>
              </div>
              <div class="bg-white px-4 pb-4 pt-3 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-0">
                    <form>
                      <label class="block text-sm font-medium leading-6 text-gray-900">Select staves</label>
                      <p class="text-sm text-gray-500">
                        Select all staves that should be displayed. If no staff is selected, the entire score is shown.
                      </p>
                      <div class="mt-2 grid grid-cols-5 sm:grid-cols-10 gap-2">
                        <For each={[...Array(30).keys()]}>{(i) =>
                          <ToggleButton
                            isToggled={selectedStaves().includes(i + 1)}
                            onToggle={(isToggled: boolean) => handleStaffToggle(i + 1, isToggled)}>
                            {i + 1}
                          </ToggleButton>
                        }</For>
                      </div>

                      <div class="mt-4 flex flew-row">
                        <label class="block text-sm font-medium leading-6 text-gray-900">Score size</label>
                      </div>
                      <p class="text-sm text-gray-500">
                        Selects the size of the displayed score.
                      </p>
                      <div class="flex flew-row mt-1 items-center w-full">
                        <input type="range" min="30" max="100" step="1" value={scaleValue()} onInput={(e) => setScaleValue(parseInt(e.target.value, 10))} onChange={handleScoreScaleChange} class="w-full accent-blue-500"/>
                        <div class="w-6 ml-3 text-gray-900 text-sm text-right">{scaleValue()}</div>
                      </div>

                      <div class="mt-4 flex flew-row">
                        <ToggleSlider isToggled={showSeparator()} onToggle={handleShowSeparatorChange}/>
                        <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Show separator between staves</label>
                      </div>
                      <p class="text-sm text-gray-500">
                        If activated, a small line is displayed between systems to make it easier to distinguish between them.
                      </p>

                      <div class="mt-4 flex flew-row">
                        <ToggleSlider isToggled={colorizeBottomSystem()} onToggle={handleColorizeBottomSystemChange}/>
                        <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Colorize bottom system</label>
                      </div>
                      <p class="text-sm text-gray-500">
                        This option colors the bottommost system to provide better orientation when turning pages.
                      </p>

                      <div class="mt-4 flex flew-row">
                        <ToggleSlider isToggled={smoothScrolling()} onToggle={handleSmoothScrollingChange}/>
                        <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Scroll smoothly</label>
                      </div>
                      <p class="text-sm text-gray-500">
                        Sets whether scrolling should happen with a smooth animation or instantly.
                      </p>

                      <div class="mt-4 flex flew-row">
                        <ToggleSlider isToggled={smartScroll()} onToggle={handleSmartScrollChange}/>
                        <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Smart scrolling</label>
                      </div>
                      <p class="text-sm text-gray-500">
                        With this activated scrolling will move the bottommost system to the top of the screen when turning pages.
                      </p>

                      <div class="mt-4 flex flew-row">
                        <label class={`block text-sm font-medium leading-6 ${smartScroll() ? "text-gray-400" : "text-gray-900"}`}>Scroll size</label>
                      </div>
                      <p class={`text-sm ${smartScroll() ? "text-gray-400" : "text-gray-500"}`}>
                        Selects the scroll size as a percentage of the screen height when "turning pages".
                      </p>
                      <div class="flex flew-row mt-1 items-center w-full">
                        <input type="range" min="5" max="100" step="1" disabled={smartScroll()} value={scrollValue()} onInput={(e) => setScrollValue(parseInt(e.target.value, 10))} onChange={handleScrollSizeChange} class="w-full accent-blue-500"/>
                        <div class={`w-10 ml-3 text-sm text-right ${smartScroll() ? "text-gray-400" : "text-gray-900"}`}>{scrollValue()}%</div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              {/*<div class="bg-gray-50 px-4 py-3 sm:flex justify-end">*/}
              {/*  <button type="button" class={`inline-flex w-full justify-center bg-white text-gray-900 ring-gray-300 ring-1 ring-inset rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto mb-3 sm:mb-0`} onClick={props.onClear}>Clear</button>*/}
              {/*  <button type="button" class={`${props.isConnected ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"} inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto`} onClick={props.onClose}>Okay</button>*/}
              {/*</div>*/}
            </div>
          </div>
        </div>


      </div>
    </>
  )
}

export default SettingsModal;