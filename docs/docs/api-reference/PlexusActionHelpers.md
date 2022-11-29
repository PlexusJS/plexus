--- 
	title: PlexusActionHelpers 
--- 

[![view on npm](http://img.shields.io/npm/v/@plexusjs/core.svg)](https://www.npmjs.org/package/@plexusjs/core)


<a name="PlexusActionHelpers"></a>

## PlexusActionHelpers
<p>The action helpers for a defined plexus action</p>

**Kind**: global class  

* [PlexusActionHelpers](#PlexusActionHelpers)
    * [.catchError](#PlexusActionHelpers+catchError)
    * [.hooks](#PlexusActionHelpers+hooks)
    * [.onCatch(handler)](#PlexusActionHelpers+onCatch)
    * [.runErrorHandlers()](#PlexusActionHelpers+runErrorHandlers)
    * [.ignoreInit()](#PlexusActionHelpers+ignoreInit)

<a name="PlexusActionHelpers+catchError"></a>

### plexusActionHelpers.catchError
**Kind**: instance property of [<code>PlexusActionHelpers</code>](#PlexusActionHelpers)  
**Internal**: Does the helper instance have any errors handlers to handle an error?  
<a name="PlexusActionHelpers+hooks"></a>

### plexusActionHelpers.hooks
**Kind**: instance property of [<code>PlexusActionHelpers</code>](#PlexusActionHelpers)  
**Internal**: Eject the external functions object returned to the user in the first argument of the action function  
<a name="PlexusActionHelpers+onCatch"></a>

### plexusActionHelpers.onCatch(handler)
<p>Add a new error handler for this action. This will catch any errors that occur during the execution of this action and prevent a crash.</p>

**Kind**: instance method of [<code>PlexusActionHelpers</code>](#PlexusActionHelpers)  

| Param | Description |
| --- | --- |
| handler | <p>A function that will be called when an error occurs; omit to fail silently.</p> |

<a name="PlexusActionHelpers+runErrorHandlers"></a>

### plexusActionHelpers.runErrorHandlers()
**Kind**: instance method of [<code>PlexusActionHelpers</code>](#PlexusActionHelpers)  
**Internal**: Run all available error handlers  
<a name="PlexusActionHelpers+ignoreInit"></a>

### plexusActionHelpers.ignoreInit()
<p>Ignore the default halt for preActions</p>

**Kind**: instance method of [<code>PlexusActionHelpers</code>](#PlexusActionHelpers)  
