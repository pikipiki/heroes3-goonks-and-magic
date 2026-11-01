/*
* InputHandler.cpp, part of VCMI engine
*
* Authors: listed in file AUTHORS in main folder
*
* License: GNU General Public License v2.0 or later
* Full text of license available in license.txt file, in main folder
*
*/

#include "StdInc.h"
#include "InputHandler.h"
#include "../MobileBridge.h"
#include "BrowserEventQueue.h"
#ifdef VCMI_HTML5_BUILD
#include "../../lib/html5/html5.h"
#endif

#include "NotificationHandler.h"
#include "InputSourceMouse.h"
#include "InputSourceKeyboard.h"
#include "InputSourceTouch.h"
#include "InputSourceText.h"
#include "InputSourceGameController.h"

#include "../GameEngine.h"
#include "../GameEngineUser.h"
#include "../gui/CursorHandler.h"
#include "../gui/EventDispatcher.h"
#include "../gui/MouseButton.h"
#include "../media/IMusicPlayer.h"
#include "../media/ISoundPlayer.h"
#include "../CMT.h"
#include "../CPlayerInterface.h"

#include "../../lib/AsyncRunner.h"
#include "../../lib/CConfigHandler.h"

#include <SDL_events.h>
#include <SDL_timer.h>
#include <SDL_clipboard.h>
#include <SDL_power.h>

InputHandler::InputHandler()
	: enableMouse(settings["input"]["enableMouse"].Bool())
	, enableTouch(settings["input"]["enableTouch"].Bool())
	, enableController(settings["input"]["enableController"].Bool())
	, currentInputMode(InputMode::KEYBOARD_AND_MOUSE)
	, mouseHandler(std::make_unique<InputSourceMouse>())
	, keyboardHandler(std::make_unique<InputSourceKeyboard>())
	, fingerHandler(std::make_unique<InputSourceTouch>())
	, textHandler(std::make_unique<InputSourceText>())
	, gameControllerHandler(std::make_unique<InputSourceGameController>())
	, cachedPowerStateMode(static_cast<int>(PowerStateMode::UNKNOWN))
	, cachedPowerStateSeconds(-1)
	, cachedPowerStatePercent(-1)
	, powerStateFrameCounter(0)
{
}

InputHandler::~InputHandler() = default;

void InputHandler::handleCurrentEvent(const SDL_Event & current)
{
	switch (current.type)
	{
		case SDL_KEYDOWN:
			setCurrentInputMode(InputMode::KEYBOARD_AND_MOUSE);
			keyboardHandler->handleEventKeyDown(current.key);
			return;
		case SDL_KEYUP:
			keyboardHandler->handleEventKeyUp(current.key);
			return;
#ifndef VCMI_EMULATE_TOUCHSCREEN_WITH_MOUSE
		case SDL_MOUSEMOTION:
			if (enableMouse)
			{
#ifdef VCMI_EMSCRIPTEN
				// Apply only the coalesced motion, under updateFrame's GUI lock.
				ENGINE->cursor().cursorMove(current.motion.x, current.motion.y);
#endif
				setCurrentInputMode(InputMode::KEYBOARD_AND_MOUSE);
				mouseHandler->handleEventMouseMotion(current.motion);
			}
			return;
		case SDL_MOUSEBUTTONDOWN:
			if (enableMouse)
			{
				setCurrentInputMode(InputMode::KEYBOARD_AND_MOUSE);
				mouseHandler->handleEventMouseButtonDown(current.button);
			}
			return;
		case SDL_MOUSEBUTTONUP:
			if (enableMouse)
				mouseHandler->handleEventMouseButtonUp(current.button);
			return;
		case SDL_MOUSEWHEEL:
			if (enableMouse)
				mouseHandler->handleEventMouseWheel(current.wheel);
			return;
#endif
		case SDL_TEXTINPUT:
			textHandler->handleEventTextInput(current.text);
			return;
		case SDL_TEXTEDITING:
			textHandler->handleEventTextEditing(current.edit);
			return;
		case SDL_FINGERMOTION:
			if (enableTouch)
			{
				setCurrentInputMode(InputMode::TOUCH);
				fingerHandler->handleEventFingerMotion(current.tfinger);
			}
			return;
		case SDL_FINGERDOWN:
			if (enableTouch)
			{
				setCurrentInputMode(InputMode::TOUCH);
				fingerHandler->handleEventFingerDown(current.tfinger);
			}
			return;
		case SDL_FINGERUP:
			if (enableTouch)
				fingerHandler->handleEventFingerUp(current.tfinger);
			return;
		case SDL_CONTROLLERAXISMOTION:
			if (enableController)
			{
				setCurrentInputMode(InputMode::CONTROLLER);
				gameControllerHandler->handleEventAxisMotion(current.caxis);
			}
			return;
		case SDL_CONTROLLERBUTTONDOWN:
			if (enableController)
			{
				setCurrentInputMode(InputMode::CONTROLLER);
				gameControllerHandler->handleEventButtonDown(current.cbutton);
			}
			return;
		case SDL_CONTROLLERBUTTONUP:
			if (enableController)
				gameControllerHandler->handleEventButtonUp(current.cbutton);
			return;
	}
}

void InputHandler::setCurrentInputMode(InputMode modi)
{
	if(currentInputMode != modi)
	{
		currentInputMode = modi;
		ENGINE->events().dispatchInputModeChanged(modi);
	}
}

InputMode InputHandler::getCurrentInputMode()
{
	return currentInputMode;
}

void InputHandler::copyToClipBoard(const std::string & text)
{
	SDL_SetClipboardText(text.c_str());
}

void InputHandler::updatePowerState()
{
	int seconds;
	int percent;
	auto sdlPowerState = SDL_GetPowerInfo(&seconds, &percent);

	PowerStateMode powerState = PowerStateMode::UNKNOWN;
	if(sdlPowerState == SDL_POWERSTATE_ON_BATTERY)
		powerState = PowerStateMode::ON_BATTERY;
	else if(sdlPowerState == SDL_POWERSTATE_CHARGING || sdlPowerState == SDL_POWERSTATE_CHARGED)
		powerState = PowerStateMode::CHARGING;

	cachedPowerStateMode.store(static_cast<int>(powerState), std::memory_order_relaxed);
	cachedPowerStateSeconds.store(seconds, std::memory_order_relaxed);
	cachedPowerStatePercent.store(percent, std::memory_order_relaxed);
}

PowerState InputHandler::getPowerState()
{
	return PowerState{
		static_cast<PowerStateMode>(cachedPowerStateMode.load(std::memory_order_relaxed)),
		cachedPowerStateSeconds.load(std::memory_order_relaxed),
		cachedPowerStatePercent.load(std::memory_order_relaxed)
	};
}

std::vector<SDL_Event> InputHandler::acquireEvents()
{
	std::unique_lock<std::mutex> lock(eventsMutex);

	std::vector<SDL_Event> result;
	std::swap(result, eventsQueue);
	return result;
}

void InputHandler::processEvents()
{
	
	// Update power state every ~300 frames (approx 5 seconds at 60 FPS)
	if (++powerStateFrameCounter >= 300)
	{
		const auto updateTask = [this]()
		{
			updatePowerState();
		};
		ENGINE->async().run(updateTask);
		powerStateFrameCounter = 0;
	}
	
	std::vector<SDL_Event> eventsToProcess = acquireEvents();

	for(const auto & currentEvent : eventsToProcess)
		handleCurrentEvent(currentEvent);

	gameControllerHandler->handleUpdate();
	fingerHandler->handleUpdate();
}

bool InputHandler::ignoreEventsUntilInput()
{
	bool inputFound = false;

	std::unique_lock<std::mutex> lock(eventsMutex);
	for(const auto & event : eventsQueue)
	{
		switch(event.type)
		{
			case SDL_MOUSEBUTTONDOWN:
			case SDL_FINGERDOWN:
			case SDL_KEYDOWN:
			case SDL_CONTROLLERBUTTONDOWN:
				inputFound = true;
		}
	}
	eventsQueue.clear();

	return inputFound;
}

void InputHandler::preprocessEvent(const SDL_Event & ev)
{
#ifdef VCMI_EMSCRIPTEN
 // The HTML presentation owns mobile pointer input. Only explicit bridge
 // commands may click the native UI underneath menus and touch controls.
 if(isMobilePresentationActive() && (ev.type==SDL_MOUSEMOTION || ev.type==SDL_MOUSEBUTTONDOWN || ev.type==SDL_MOUSEBUTTONUP || ev.type==SDL_MOUSEWHEEL || ev.type==SDL_FINGERDOWN || ev.type==SDL_FINGERUP || ev.type==SDL_FINGERMOTION)) return;
#endif

	if(ev.type == SDL_QUIT)
	{
#ifndef VCMI_EMSCRIPTEN
		std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
#ifdef VCMI_ANDROID
		ENGINE->user().onShutdownRequested(false);
#else
		ENGINE->user().onShutdownRequested(true);
#endif
		return;
	}
	else if(ev.type == SDL_APP_WILLENTERBACKGROUND)
	{
#ifndef VCMI_EMSCRIPTEN
		std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
		ENGINE->user().onAppPaused();
		return;
	}
	else if(ev.type == SDL_KEYDOWN)
	{
		if(ev.key.keysym.sym == SDLK_F4 && (ev.key.keysym.mod & KMOD_ALT))
		{
			// FIXME: dead code? Looks like intercepted by OS/SDL and delivered as SDL_Quit instead?
#ifndef VCMI_EMSCRIPTEN
			std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
			ENGINE->user().onShutdownRequested(true);
			return;
		}

		if(ev.key.keysym.scancode == SDL_SCANCODE_AC_BACK && !settings["input"]["handleBackRightMouseButton"].Bool())
		{
#ifndef VCMI_EMSCRIPTEN
			std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
			ENGINE->user().onShutdownRequested(true);
			return;
		}
	}
	else if(ev.type == SDL_USEREVENT)
	{
#ifndef VCMI_EMSCRIPTEN
		std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
		handleUserEvent(ev.user);

		return;
	}
	else if(ev.type == SDL_WINDOWEVENT)
	{
#ifdef VCMI_HTML5_BUILD
		// Safari can emit window-size/restored events during rotation although
		// the mobile source canvas remains 1600x1200. Do not recreate its
		// textures or wait on the interface mutex for those DOM-only changes.
		if(html5::getGoonkRenderScale() > 1 &&
			(ev.window.event == SDL_WINDOWEVENT_SIZE_CHANGED || ev.window.event == SDL_WINDOWEVENT_RESTORED))
			return;
#endif
		switch (ev.window.event) {
			case SDL_WINDOWEVENT_RESTORED:
#ifndef VCMI_IOS
			{
#ifndef VCMI_EMSCRIPTEN
				std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
				ENGINE->onScreenResize(false, false);
			}
#endif
				break;
			case SDL_WINDOWEVENT_SIZE_CHANGED:
			{
#ifndef VCMI_EMSCRIPTEN
				std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
#ifdef VCMI_MOBILE
				ENGINE->onScreenResize(true, false);
#else
				ENGINE->onScreenResize(true, true);
#endif
			}
				break;
			case SDL_WINDOWEVENT_FOCUS_GAINED:
			{
#ifndef VCMI_EMSCRIPTEN
				std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
				if(settings["general"]["audioMuteFocus"].Bool()) {
					ENGINE->music().setVolume(settings["general"]["music"].Integer());
					ENGINE->sound().setVolume(settings["general"]["sound"].Integer());
				}
			}
				break;
			case SDL_WINDOWEVENT_FOCUS_LOST:
			{
#ifndef VCMI_EMSCRIPTEN
				std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
				if(settings["general"]["audioMuteFocus"].Bool()) {
					ENGINE->music().setVolume(0);
					ENGINE->sound().setVolume(0);
				}
			}
				break;
		}
		return;
	}
	else if(ev.type == SDL_SYSWMEVENT)
	{
#ifndef VCMI_EMSCRIPTEN
		std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
		if(!settings["session"]["headless"].Bool() && settings["general"]["notifications"].Bool())
		{
			NotificationHandler::handleSdlEvent(ev);
		}
	}
	else if(ev.type == SDL_CONTROLLERDEVICEADDED)
	{
		gameControllerHandler->handleEventDeviceAdded(ev.cdevice);
		return;
	}
	else if(ev.type == SDL_CONTROLLERDEVICEREMOVED)
	{
		gameControllerHandler->handleEventDeviceRemoved(ev.cdevice);
		return;
	}
	else if(ev.type == SDL_CONTROLLERDEVICEREMAPPED)
	{
		gameControllerHandler->handleEventDeviceRemapped(ev.cdevice);
		return;
	}

#if !defined(VCMI_EMULATE_TOUCHSCREEN_WITH_MOUSE) && !defined(VCMI_EMSCRIPTEN)
	//preprocessing
	if(ev.type == SDL_MOUSEMOTION)
	{
#ifndef VCMI_EMSCRIPTEN
		std::scoped_lock interfaceLock(ENGINE->interfaceMutex);
#endif
		ENGINE->cursor().cursorMove(ev.motion.x, ev.motion.y);
	}
#endif

	{
		std::unique_lock<std::mutex> lock(eventsMutex);

		// In a sequence of motion events, skip all but the last one.
		// This prevents freezes when every motion event takes longer to handle than interval at which
		// the events arrive (like dragging on the minimap in world view, with redraw at every event)
		// so that the events would start piling up faster than they can be processed.
		if (!eventsQueue.empty())
		{
			const SDL_Event & prev = eventsQueue.back();

			if(ev.type == SDL_MOUSEMOTION && prev.type == SDL_MOUSEMOTION)
			{
				SDL_Event accumulated = ev;
				accumulated.motion.xrel += prev.motion.xrel;
				accumulated.motion.yrel += prev.motion.yrel;
				eventsQueue.back() = accumulated;
				return;
			}

			if(ev.type == SDL_FINGERMOTION && prev.type == SDL_FINGERMOTION && ev.tfinger.fingerId == prev.tfinger.fingerId)
			{
				SDL_Event accumulated = ev;
				accumulated.tfinger.dx += prev.tfinger.dx;
				accumulated.tfinger.dy += prev.tfinger.dy;
				eventsQueue.back() = accumulated;
				return;
			}
		}
		eventsQueue.push_back(ev);
	}
}

void InputHandler::fetchEvents()
{
 SDL_Event ev;
#ifdef VCMI_EMSCRIPTEN
 // A focus/visibility event must never block the browser while a worker owns
 // the interface mutex and may be waiting for a browser-thread proxy.
 while(SDL_PollEvent(&ev)==1)deferredBrowserEvents.push_back(ev);
 browser_input::drain(deferredBrowserEvents,ENGINE->interfaceMutex,[this](const SDL_Event & event){preprocessEvent(event);});
#else
 while(SDL_PollEvent(&ev)==1)preprocessEvent(ev);
#endif
}

bool InputHandler::isKeyboardCmdDown() const
{
	return keyboardHandler->isKeyboardCmdDown();
}

bool InputHandler::isKeyboardCtrlDown() const
{
	return keyboardHandler->isKeyboardCtrlDown();
}

bool InputHandler::isKeyboardAltDown() const
{
	return keyboardHandler->isKeyboardAltDown();
}

bool InputHandler::isKeyboardShiftDown() const
{
	return keyboardHandler->isKeyboardShiftDown();
}

void InputHandler::moveCursorPosition(const Point & distance)
{
	setCursorPosition(getCursorPosition() + distance);
}

void InputHandler::setCursorPosition(const Point & position)
{
	cursorPosition = position;
	ENGINE->events().dispatchMouseMoved(Point(0, 0), position);
}

void InputHandler::startTextInput(const Rect & where)
{
	textHandler->startTextInput(where);
}

void InputHandler::stopTextInput()
{
	textHandler->stopTextInput();
}

void InputHandler::hapticFeedback()
{
	if(currentInputMode == InputMode::TOUCH)
		fingerHandler->hapticFeedback();
}

uint32_t InputHandler::getTicks()
{
	return SDL_GetTicks();
}

bool InputHandler::hasTouchInputDevice() const
{
	return fingerHandler->hasTouchInputDevice();
}

int InputHandler::getNumTouchFingers() const
{
	if(currentInputMode != InputMode::TOUCH)
		return 0;
	return fingerHandler->getNumTouchFingers();
}

void InputHandler::dispatchMainThread(const std::function<void()> & functor)
{
	auto heapFunctor = std::make_unique<std::function<void()>>(functor);

	SDL_Event event;
	event.user.type = SDL_USEREVENT;
	event.user.code = 0;
	event.user.data1 = nullptr;
	event.user.data2 = nullptr;

	// NOTE: approach with dispatchedTasks container is a bit excessive
	// used mostly to prevent false-positives leaks in analyzers
	dispatchedTasks.push(std::move(heapFunctor));
	SDL_PushEvent(&event);
}

void InputHandler::handleUserEvent(const SDL_UserEvent & current)
{
	std::unique_ptr<std::function<void()>> task;

	if (!dispatchedTasks.try_pop(task))
	{
		logGlobal->error("InputHandler::handleUserEvent received without active task!");
		return;
	}

	(*task)();
}

const Point & InputHandler::getCursorPosition() const
{
	return cursorPosition;
}
