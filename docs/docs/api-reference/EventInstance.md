--- 
	title: EventInstance 
--- 

[![view on npm](http://img.shields.io/npm/v/@plexusjs/core.svg)](https://www.npmjs.org/package/@plexusjs/core)


		<a name="EventInstance"></a>

## EventInstance
<p>A Plexus Event. This is a trackable event that can be listened to and fired.</p>

**Kind**: global class  

* [EventInstance](#EventInstance)
    * [.once(callback)](#EventInstance+once)
    * [.on(callback)](#EventInstance+on)
    * [.emit(payload)](#EventInstance+emit)
    * [.disable(disable)](#EventInstance+disable)

<a name="EventInstance+once"></a>

### eventInstance.once(callback)
<p>Listen for an event only once</p>

**Kind**: instance method of [<code>EventInstance</code>](#EventInstance)  

| Param | Description |
| --- | --- |
| callback | <p>The function to call when the event is fired</p> |

<a name="EventInstance+on"></a>

### eventInstance.on(callback)
<p>Listen for an event</p>

**Kind**: instance method of [<code>EventInstance</code>](#EventInstance)  

| Param | Description |
| --- | --- |
| callback | <p>The function to call when the event is fired</p> |

<a name="EventInstance+emit"></a>

### eventInstance.emit(payload)
<p>Broadcast an event to all listeners</p>

**Kind**: instance method of [<code>EventInstance</code>](#EventInstance)  

| Param | Description |
| --- | --- |
| payload | <p>The payload to send to all listeners</p> |

<a name="EventInstance+disable"></a>

### eventInstance.disable(disable)
<p>Turn the Event Manager off/on</p>

**Kind**: instance method of [<code>EventInstance</code>](#EventInstance)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| disable | <code>boolean</code> | <code>true</code> | <p>Should this event Engine be disabled</p> |

