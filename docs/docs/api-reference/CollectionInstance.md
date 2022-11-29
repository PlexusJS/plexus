--- 
	title: CollectionInstance 
--- 

[![view on npm](http://img.shields.io/npm/v/@plexusjs/core.svg)](https://www.npmjs.org/package/@plexusjs/core)


<a name="CollectionInstance"></a>

## CollectionInstance
<p>A Collection Instance</p>

**Kind**: global class  

* [CollectionInstance](#CollectionInstance)
    * [.id](#CollectionInstance+id)
    * [.instanceId](#CollectionInstance+instanceId)
    * [.value](#CollectionInstance+value) ⇒
    * [.keys](#CollectionInstance+keys) ⇒
    * [.groups](#CollectionInstance+groups) ⇒
    * [.groupsValue](#CollectionInstance+groupsValue) ⇒
    * [.selectors](#CollectionInstance+selectors) ⇒
    * [.selectorsValue](#CollectionInstance+selectorsValue) ⇒
    * [.name](#CollectionInstance+name)
    * [.isCreatedGroup(name)](#CollectionInstance+isCreatedGroup) ⇒
    * [.isCreatedSelector(name)](#CollectionInstance+isCreatedSelector) ⇒
    * [.collect(data, groups)](#CollectionInstance+collect)
    * [.update(key, data, config)](#CollectionInstance+update)
    * [.getItem(key)](#CollectionInstance+getItem) ⇒
    * [.getItemValue(key)](#CollectionInstance+getItemValue) ⇒
    * [.createSelector(name)](#CollectionInstance+createSelector) ⇒
    * [.createSelectors(names)](#CollectionInstance+createSelectors) ⇒
    * [.getSelector(name)](#CollectionInstance+getSelector) ⇒
    * [.createGroup(groupName, config)](#CollectionInstance+createGroup) ⇒
    * [.createGroups(groupNames)](#CollectionInstance+createGroups) ⇒
    * [.getGroup(name)](#CollectionInstance+getGroup) ⇒
    * [.getGroupsOf(key)](#CollectionInstance+getGroupsOf) ⇒
    * [.addToGroups(key, groups)](#CollectionInstance+addToGroups)
    * [.delete(keys)](#CollectionInstance+delete)
    * [.removeFromGroup(keys, groups)](#CollectionInstance+removeFromGroup)
    * [.clear([GroupName])](#CollectionInstance+clear)
    * [.compute(fn)](#CollectionInstance+compute)
    * [.reCompute()](#CollectionInstance+reCompute)
    * [.reComputeGroups()](#CollectionInstance+reComputeGroups)
    * [.key()](#CollectionInstance+key)

<a name="CollectionInstance+id"></a>

### collectionInstance.id
<p>The internal ID of the collection</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
<a name="CollectionInstance+instanceId"></a>

### collectionInstance.instanceId
<p>The internal id of the collection with an instance prefix</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
<a name="CollectionInstance+value"></a>

### collectionInstance.value ⇒
<p>Get all of the collection data values as an array</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The collection data values as an array</p>  
<a name="CollectionInstance+keys"></a>

### collectionInstance.keys ⇒
<p>Get all of the collection data keys as an array</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The collection data values as an array</p>  
<a name="CollectionInstance+groups"></a>

### collectionInstance.groups ⇒
<p>Get all the groups in the collection as an object</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The groups in the collection</p>  
<a name="CollectionInstance+groupsValue"></a>

### collectionInstance.groupsValue ⇒
<p>Get all the groups and their children's data values as an object</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The groups paired with their children's data values as an object</p>  
<a name="CollectionInstance+selectors"></a>

### collectionInstance.selectors ⇒
<p>Get all the groups in the collection as an object</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The groups in the collection</p>  
<a name="CollectionInstance+selectorsValue"></a>

### collectionInstance.selectorsValue ⇒
<p>Get all the groups and their childrens data values as an object</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The groups paired with their childrens data values as an object</p>  
<a name="CollectionInstance+name"></a>

### collectionInstance.name
<p>Get the name (generated or custom) of the collection store</p>

**Kind**: instance property of [<code>CollectionInstance</code>](#CollectionInstance)  
<a name="CollectionInstance+isCreatedGroup"></a>

### collectionInstance.isCreatedGroup(name) ⇒
<p>Helper function; Checks to see if the provided name is a group name</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>boolean: if the name is a specific name of a group</p>  

| Param | Description |
| --- | --- |
| name | <p>The name to check</p> |

<a name="CollectionInstance+isCreatedSelector"></a>

### collectionInstance.isCreatedSelector(name) ⇒
<p>Helper function; Checks to see if the provided name is a selector name</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>boolean: if the name is a specific name of a selector</p>  

| Param | Description |
| --- | --- |
| name | <p>The name to check</p> |

<a name="CollectionInstance+collect"></a>

### collectionInstance.collect(data, groups)
<p>Collect An item of data (or many items of data using an array) into the collection.</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Requires:**: Each data item must have the primary key as a property  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Object&gt;</code> \| <code>Object</code> | <p>The data to collect</p> |
| groups | <code>string</code> \| <code>Array.&lt;string&gt;</code> | <p>The groups to add the items to</p> |

<a name="CollectionInstance+update"></a>

### collectionInstance.update(key, data, config)
<p>Update the collection with data;
This is like collect but will not add new items, and can can be used to patch existing items</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param | Description |
| --- | --- |
| key | <p>The key of the item to update</p> |
| data | <p>The data to update the item with</p> |
| config | <p>The configuration to use for the update</p> |
| config.deep | <p>Should the update be deep or shallow</p> |

<a name="CollectionInstance+getItem"></a>

### collectionInstance.getItem(key) ⇒
<p>Get the Value of the data item with the provided key (the raw data). If there is not an existing data item, this will return a <em>provisional</em> one</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The data item with the provided key</p>  

| Param |
| --- |
| key | 

<a name="CollectionInstance+getItemValue"></a>

### collectionInstance.getItemValue(key) ⇒
<p>Get the value of an item in the collection</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The value of the item</p>  

| Param | Description |
| --- | --- |
| key | <p>The key of the item to get</p> |

<a name="CollectionInstance+createSelector"></a>

### collectionInstance.createSelector(name) ⇒
<p>Create a Selector instance for a given selector name</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The new Collection Instance</p>  

| Param | Description |
| --- | --- |
| name | <p>The name of the selector</p> |

<a name="CollectionInstance+createSelectors"></a>

### collectionInstance.createSelectors(names) ⇒
<p>Create Selector instances for a given set of selector names</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The new Collection Instance</p>  

| Param | Description |
| --- | --- |
| names | <p>The names of the selectors to create</p> |

<a name="CollectionInstance+getSelector"></a>

### collectionInstance.getSelector(name) ⇒
<p>Get A Group instance of a given group name</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>Either a Group Instance or undefined</p>  

| Param | Description |
| --- | --- |
| name | <p>The Group Name to search for</p> |

<a name="CollectionInstance+createGroup"></a>

### collectionInstance.createGroup(groupName, config) ⇒
<p>Create a group with a name and a configuration</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The new Collection Instance</p>  

| Param | Description |
| --- | --- |
| groupName | <p>The name of the group</p> |
| config |  |

<a name="CollectionInstance+createGroups"></a>

### collectionInstance.createGroups(groupNames) ⇒
<p>Create multiple groups with a name (no configuration)</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The new Collection Instance</p>  

| Param | Description |
| --- | --- |
| groupNames | <p>The names of the groups to create</p> |

<a name="CollectionInstance+getGroup"></a>

### collectionInstance.getGroup(name) ⇒
<p>Get A Group instance of a given group name</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>Group Instance</p>  

| Param | Description |
| --- | --- |
| name | <p>The Group Name to search for</p> |

<a name="CollectionInstance+getGroupsOf"></a>

### collectionInstance.getGroupsOf(key) ⇒
<p>Given a key, get all Group names that the key is in</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
**Returns**: <p>The Group names that the key is in</p>  

| Param | Description |
| --- | --- |
| key | <p>The data key(s) to use for lookup</p> |

<a name="CollectionInstance+addToGroups"></a>

### collectionInstance.addToGroups(key, groups)
<p>Add a data item to a group or groups</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param | Description |
| --- | --- |
| key | <p>The key of the item to add</p> |
| groups | <p>The group(s) to add the item to</p> |

<a name="CollectionInstance+delete"></a>

### collectionInstance.delete(keys)
<p>Delete a data item completely from the collection.</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param | Description |
| --- | --- |
| keys | <p>The data key(s) to use for lookup</p> |

<a name="CollectionInstance+removeFromGroup"></a>

### collectionInstance.removeFromGroup(keys, groups)
<p>Remove a data item from a set of groups</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param | Description |
| --- | --- |
| keys | <p>The data key(s) to use for lookup</p> |
| groups | <p>Either a single group or an array of groups to remove the data from</p> |

<a name="CollectionInstance+clear"></a>

### collectionInstance.clear([GroupName])
<p>Delete all data in the collection</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param | Type | Description |
| --- | --- | --- |
| [GroupName] | <code>string</code> | <p>(Optional) Either an array or a single group name to clear data from</p> |

<a name="CollectionInstance+compute"></a>

### collectionInstance.compute(fn)
<p>Run this function when data is collected to format it in a particular way; useful for converting one datatype into another</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  

| Param |
| --- |
| fn | 

<a name="CollectionInstance+reCompute"></a>

### collectionInstance.reCompute()
<p>Re-runs the compute function on select IDs (or all the collection if none provided)</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
<a name="CollectionInstance+reComputeGroups"></a>

### collectionInstance.reComputeGroups()
<p>Same as reCompute, but for groups</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
<a name="CollectionInstance+key"></a>

### collectionInstance.key()
<p>Set the key of the collection for enhanced internal tracking</p>

**Kind**: instance method of [<code>CollectionInstance</code>](#CollectionInstance)  
