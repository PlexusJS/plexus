--- 
	title: CollectionDataInstance 
--- 

[![view on npm](http://img.shields.io/npm/v/@plexusjs/core.svg)](https://www.npmjs.org/package/@plexusjs/core)

${description}
<a name="CollectionDataInstance"></a>

## CollectionDataInstance
<p>A collection of data</p>

**Kind**: global class  

* [CollectionDataInstance](#CollectionDataInstance)
    * [.id](#CollectionDataInstance+id)
    * [.instanceId](#CollectionDataInstance+instanceId)
    * [.value](#CollectionDataInstance+value)
    * [.lastValue](#CollectionDataInstance+lastValue)
    * [.initialValue](#CollectionDataInstance+initialValue)
    * [.set(value)](#CollectionDataInstance+set)
    * [.patch(value)](#CollectionDataInstance+patch)
    * [.isEqual(value)](#CollectionDataInstance+isEqual) ⇒ <code>boolean</code>
    * [.delete()](#CollectionDataInstance+delete)
    * [.clean()](#CollectionDataInstance+clean)
    * [.watch(callback)](#CollectionDataInstance+watch) ⇒

<a name="CollectionDataInstance+id"></a>

### collectionDataInstance.id
<p>The internal id of the state with an instance prefix</p>

**Kind**: instance property of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+instanceId"></a>

### collectionDataInstance.instanceId
<p>The internal id of the state with an instance prefix</p>

**Kind**: instance property of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+value"></a>

### collectionDataInstance.value
<p>Get the value of the data instance</p>

**Kind**: instance property of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+lastValue"></a>

### collectionDataInstance.lastValue
<p>The previous (reactive) value of the state</p>

**Kind**: instance property of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+initialValue"></a>

### collectionDataInstance.initialValue
<p>The initial (default) value of the state</p>

**Kind**: instance property of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+set"></a>

### collectionDataInstance.set(value)
<p>Set the value of the data instance</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  

| Param | Description |
| --- | --- |
| value | <p>The value to set</p> |

<a name="CollectionDataInstance+patch"></a>

### collectionDataInstance.patch(value)
<p>Patch the current value of the state</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  

| Param | Description |
| --- | --- |
| value | <p>A value of the state to merge with the current value</p> |

<a name="CollectionDataInstance+isEqual"></a>

### collectionDataInstance.isEqual(value) ⇒ <code>boolean</code>
<p>Compare a thing to the current value, if they are equal, returns true</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
**Returns**: <code>boolean</code> - <p>A boolean representing if they are equal</p>  

| Param | Description |
| --- | --- |
| value | <p>The thing to compare the current value to</p> |

<a name="CollectionDataInstance+delete"></a>

### collectionDataInstance.delete()
<p>Delete the data instance</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+clean"></a>

### collectionDataInstance.clean()
<p>Clean this data instance (remove all watchers &amp; remove the state from the instance)</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
<a name="CollectionDataInstance+watch"></a>

### collectionDataInstance.watch(callback) ⇒
<p>Watch for changes on this data instance</p>

**Kind**: instance method of [<code>CollectionDataInstance</code>](#CollectionDataInstance)  
**Returns**: <p>The remove function to stop watching</p>  

| Param | Description |
| --- | --- |
| callback | <p>The callback to run when the state changes</p> |

