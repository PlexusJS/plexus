--- 
	title: CollectionSelector 
--- 

[![view on npm](http://img.shields.io/npm/v/@plexusjs/core.svg)](https://www.npmjs.org/package/@plexusjs/core)

${description}
<a name="CollectionSelector"></a>

## CollectionSelector
<p>A selector for data</p>

**Kind**: global class  

* [CollectionSelector](#CollectionSelector)
    * [.id](#CollectionSelector+id)
    * [.instanceId](#CollectionSelector+instanceId)
    * [.key](#CollectionSelector+key)
    * [.value](#CollectionSelector+value)
    * [.data](#CollectionSelector+data)
    * [.select(key)](#CollectionSelector+select)
    * [.set(value, config)](#CollectionSelector+set)
    * [.patch(value, config)](#CollectionSelector+patch)
    * [.watch(callback)](#CollectionSelector+watch) ⇒

<a name="CollectionSelector+id"></a>

### collectionSelector.id
<p>The internal ID of the Selector</p>

**Kind**: instance property of [<code>CollectionSelector</code>](#CollectionSelector)  
<a name="CollectionSelector+instanceId"></a>

### collectionSelector.instanceId
<p>The internal id of the Selector with an instance prefix</p>

**Kind**: instance property of [<code>CollectionSelector</code>](#CollectionSelector)  
<a name="CollectionSelector+key"></a>

### collectionSelector.key
<p>The key of a data item assigned to this selector</p>

**Kind**: instance property of [<code>CollectionSelector</code>](#CollectionSelector)  
<a name="CollectionSelector+value"></a>

### collectionSelector.value
<p>Return the data value of the selected item</p>

**Kind**: instance property of [<code>CollectionSelector</code>](#CollectionSelector)  
<a name="CollectionSelector+data"></a>

### collectionSelector.data
<p>The data of the selector</p>

**Kind**: instance property of [<code>CollectionSelector</code>](#CollectionSelector)  
<a name="CollectionSelector+select"></a>

### collectionSelector.select(key)
<p>Select an item in the collection</p>

**Kind**: instance method of [<code>CollectionSelector</code>](#CollectionSelector)  

| Param | Description |
| --- | --- |
| key | <p>The key to select</p> |

<a name="CollectionSelector+set"></a>

### collectionSelector.set(value, config)
<p>Set the value of the selected data instance</p>

**Kind**: instance method of [<code>CollectionSelector</code>](#CollectionSelector)  

| Param | Description |
| --- | --- |
| value | <p>The value to set</p> |
| config | <p>The config to use when setting the value</p> |
| config.mode | <p>should we 'patch' or 'replace' the value</p> |

<a name="CollectionSelector+patch"></a>

### collectionSelector.patch(value, config)
<p>Patch the value of the selected data instance</p>

**Kind**: instance method of [<code>CollectionSelector</code>](#CollectionSelector)  

| Param | Description |
| --- | --- |
| value | <p>The value to set</p> |
| config | <p>The config to use when setting the value</p> |
| config.mode | <p>should we 'patch' or 'replace' the value</p> |

<a name="CollectionSelector+watch"></a>

### collectionSelector.watch(callback) ⇒
<p>Watch for changes on this selector</p>

**Kind**: instance method of [<code>CollectionSelector</code>](#CollectionSelector)  
**Returns**: <p>The remove function to stop watching</p>  

| Param | Description |
| --- | --- |
| callback | <p>The callback to run when the state changes</p> |

