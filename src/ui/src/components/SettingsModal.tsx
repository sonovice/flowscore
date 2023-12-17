import {createEffect, For} from "solid-js";
import ToggleSlider from "./ToggleSlider.tsx";
import ToggleButton from "./ToggleButton.tsx";
import {useSettings} from '../contexts/SettingsContext.tsx';

function SettingsModal(props) {
  const [settings, setSettings] = useSettings();

  function handleStaffToggle(i: number, isToggled: boolean) {
    const currentSettings = settings();
    let newSelectedStaves = [...currentSettings.selectedStaves];

    if (isToggled) {
      newSelectedStaves.push(i);
    } else {
      newSelectedStaves = newSelectedStaves.filter(num => num !== i);
    }

    newSelectedStaves.sort((a, b) => a - b);
    setSettings({...currentSettings, selectedStaves: newSelectedStaves});
  }

  function handleScoreScaleChange(e) {
    setSettings({...settings(), scoreScale: parseInt(e.target.value, 10)});
  }

  function handleToggleOptionChange(optionName, value) {
    setSettings({...settings(), [optionName]: value});
  }

  function handleScrollSizeChange(e) {
    setSettings({...settings(), scrollPercentage: parseInt(e.target.value, 10)});
  }

  createEffect(() => {
    console.log(settings());
  })

  return (
    <>
      <div class="ease-in-out duration-300 relative z-10" role="dialog">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" ></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xl font-bold px-4 py-2">
                FlowScore
              </div>
              <div class="bg-white px-4 pb-4 pt-3 sm:pt-5 sm:pb-4">
                <div class="sm:flex sm:items-start">

                  <div class="hidden sm:flex mx-auto h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-7 w-7 text-blue-500" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path
                        d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
                    </svg>
                  </div>
                  <div class="sm:ml-4 mt-0">
                    <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">Settings</h3>
                    <div class="mt-2">
                      <form>
                        <label class="block text-sm font-medium leading-6 text-gray-900">Select staves</label>
                        <p class="text-sm text-gray-500">
                          Select all staves that should be displayed. If no staff is selected, the entire score is shown.
                        </p>
                        <div class="mt-2 grid grid-cols-5 sm:grid-cols-10 gap-2">
                          <For each={[...Array(30).keys()]}>{(i) =>
                            <ToggleButton
                              isToggled={settings().selectedStaves.includes(i + 1)}
                              onToggle={(isToggled: boolean) => handleStaffToggle(i + 1, isToggled)}>
                              {i + 1}
                            </ToggleButton>
                          }</For>
                        </div>

                        <div class="mt-6 flex flew-row">
                          <label class="block text-sm font-medium leading-6 text-gray-900">Score size</label>
                        </div>
                        <p class="text-sm text-gray-500">
                          Selects the size of the displayed score.
                        </p>
                        <div class="flex flew-row mt-1 items-center">
                          <input type="range" min="30" max="100" step="1" class="w-full accent-blue-500" value={settings().scoreScale} onChange={handleScoreScaleChange}/>
                          <div class="ml-3 text-gray-900 text-sm">{settings().scoreScale}</div>
                        </div>

                        <div class="mt-6 flex flew-row">
                          <ToggleSlider isToggled={settings().showDivider} onToggle={(isToggled: boolean) => handleToggleOptionChange('showDivider', isToggled)}/>
                          <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Show divider between staves</label>
                        </div>
                        <p class="text-sm text-gray-500">
                          If activated, a small gray line is displayed between systems to make it easier to distinguish between them.
                        </p>

                        <div class="mt-6 flex flew-row">
                          <ToggleSlider isToggled={settings().colorizeBottomSystem} onToggle={(isToggled: boolean) => handleToggleOptionChange('colorizeBottomSystem', isToggled)}/>
                          <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Colorize bottom system</label>
                        </div>
                        <p class="text-sm text-gray-500">
                          This option colors the bottommost system to provide better orientation when turning pages.
                        </p>

                        <div class="mt-6 flex flew-row">
                          <ToggleSlider isToggled={settings().smartScroll} onToggle={(isToggled: boolean) => handleToggleOptionChange('smartScroll', isToggled)}/>
                          <label class="ml-4 block text-sm font-medium leading-6 text-gray-900">Smart scrolling</label>
                        </div>
                        <p class="text-sm text-gray-500">
                          Instead of scrolling with a fixed increment, the optimum value is determined automatically.
                        </p>

                        <div class="mt-6 flex flew-row">
                          <label class={`block text-sm font-medium leading-6 ${settings().smartScroll ? "text-gray-400" : "text-gray-900"}`}>Scroll size</label>
                        </div>
                        <p class={`text-sm ${settings().smartScroll ? "text-gray-400" : "text-gray-500"}`}>
                          Selects the scroll size as a percentage of the screen height when "turning pages".
                        </p>
                        <div class="flex flew-row mt-1 items-center">
                          <input type="range" min="30" max="100" step="1" disabled={settings().smartScroll} value={settings().scrollPercentage} onInput={handleScrollSizeChange} class="w-full accent-blue-500"/>
                          <div class={`ml-3 text-sm ${settings().smartScroll ? "text-gray-400" : "text-gray-900"}`}>{settings().scrollPercentage}%</div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse">
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 sm:ml-3 sm:w-auto" onClick={props.onClose}>Close</button>
                {/*<button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Close</button>*/}
              </div>
            </div>
          </div>
        </div>


      </div>
    </>
  )
}

export default SettingsModal;