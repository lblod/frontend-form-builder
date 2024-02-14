# Aggregate field

## Steps

1. Add the aggregate field to the ttl
2. Create a table with at least one field that contains a number
3. Create the listing scope that will glue the table values with the aggregate field
4. For the field you want to include into your calculation you have to define a path
5. Add the target predicate to our aggregate field
6. Update the `form:TableListing`
7. Cleanup
8. Ttl code at the end

### 1. Aggregate field

```ttl
nodes:totalExpenseF
    a form:Field ;
    form:displayType displayTypes:aggregateField ;
    form:partOf ext:mainPg ;
    sh:name "Aggregate field" ;
    sh:order 3 .
```

### 2. Table

You can create a table listing with the formbuilder. To this code you have to make some adjustments to make the aggregate field work with it. Add one field to this table that is one of these `displayTypes`: numericalInput/currencyInput/currencyInput and name the table `expense table`.

### 3. Listing scope

The created table already has a `Scope` defined. This one can be removed and replaced by the new scope below.

```ttl
ext:expenseS a form:Scope ;
    sh:path ext:Expense .
```

Add this scope to the table listing

```ttl
ext:expenseTableL
    a form:Listing, form:ListingTable ;
    form:scope ext:expenseS ;
```

### 4. Table field path

You added a field with a numerical input to your table. This field needs to have a `path` so we know where to get the input value of those fields. This path is someting you can choose yourself. I will give an example below. Im using ext:amopunt for this because i want to count my total Expense for example.

```ttl
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix ext: <http://mu.semte.ch/vocabularies/ext/>.

<FIELD SUBJECT>
  sh:path ext:amount .
```

## 5. Target predicate for aggregate field

Our aggregate field will need the predicate `xsd:target` this will point to our listingScope with our table field path.(we used `ext:amount`)

```ttl
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<AGGREGATE FIELD>
    xsd:target (ext:Expense ext:amount) ;
```

Our aggregate field will look like this now

```ttl
nodes:totalExpenseF
    a form:Field ;
    form:displayType displayTypes:aggregateField ;
    form:partOf ext:mainPg ;
    sh:name "Aggregate field" ;
    sh:order 3 ;
    xsd:target (ext:Expense ext:amount) .
```

## 6. Table listing

This generator is needed to create the data entries in our forkingStore. In here we can define the shape that will be added in our store. For example we can set a default value for our `ext:amount`.

```ttl
ext:expenseGenerator
    a form:Generator;
    form:dataGenerator form:addMuUuid;
    form:prototype [
      form:shape [
        a ext:Expense ;
          ext:amount 0.0
      ]
    ] .
```

Ofcourse we have to add this generator to one of our subjects. Noramlly in your ttlcode a `form:ListingTable` is created. On this subject we can add the predicate `form:createGenerator` and we will add our newly create generator to it as value.

**Note:** Normally when the table has been created with tyhe formbuilder builder a generator is already defined. You can remove this line and replace it with the one below. Also do not forget to remove the generator sub ject with the predicates that was linked to the previous generator.

```ttl
ext:expenseTableL
    a form:Listing, form:ListingTable ;
    form:createGenerator ext:expenseGenerator ;
```

This table listing has to also be linked to our created listingScope (`expenseS`). We will add following code to our table listing.

```ttl
<TABLE LISTING>
    form:scope ext:expenseS ;
```

Your table listing will include these predicates now.

```ttl
ext:expenseTableL
    a form:Listing, form:ListingTable ;
    form:createGenerator ext:expenseGenerator ;
    form:scope ext:expenseS ;
```

## 7. Cleanup

When you save your changes and than open reload the code editor (refresh or switch tabs) warning are shown of unreferenced subjects. Go through these ids and remove the subjects as they are not needed in the ttl code.

⚠️ If you look in the builder tab and see an empty field. DO NOT REMOVE this. Thanks :D

## 8. Ttl code at the end

```ttl
@prefix : <#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix display: <http://lblod.data.gift/display-types/>.
@prefix form: <http://lblod.data.gift/vocabularies/forms/>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix nodes: <http://data.lblod.info/form-data/nodes/>.
@prefix emb: <http://ember-submission-form-fields/>.
@prefix ext: <http://mu.semte.ch/vocabularies/ext/>.

nodes:06bdfd6f-7f3e-4c20-ace3-826aaa5f4a37
    a form:SubForm;
    form:includes
        nodes:31951c5d-7cac-4475-a155-6e3186941759,
        nodes:69330280-62a3-4677-a2db-5ef739922893,
        nodes:9be008e5-4326-4c50-b1d7-93d28e66396b;
    form:removeLabel "Remove row text";
    sh:name "The subform title".

nodes:31951c5d-7cac-4475-a155-6e3186941759
    a form:Field;
    form:displayType display:defaultInput;
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75;
    sh:name "Soorten kosten";
    sh:order 1;
    sh:path nodes:3fbfa1bd-4e50-41c3-a837-14fad8980e2a.

nodes:3d561f39-85dd-441d-a2a6-98826e6e1dc8
    a form:Listing, form:ListingTable;
    form:addLabel "Add row text";
    form:canAdd true;
    form:canRemove true;
    form:createGenerator ext:expenseGenerator;
    form:each nodes:06bdfd6f-7f3e-4c20-ace3-826aaa5f4a37;
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75;
    form:scope ext:expenseS;
    sh:order 1 .

nodes:69330280-62a3-4677-a2db-5ef739922893
    a form:Field;
    form:displayType display:currencyInput;
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75;
    sh:name "Bedrag in euro";
    sh:order 2;
    sh:path ext:amount.

nodes:9be008e5-4326-4c50-b1d7-93d28e66396b
    a form:Field;
    form:displayType display:textArea;
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75;
    sh:name "Verantwoording";
    sh:order 3;
    sh:path nodes:b9ca9f1d-2654-4bce-9240-7b12cfc0424a.

nodes:a4503b20-7c8f-497c-abac-9650691cec75
a form:Section; sh:name "Tables"; sh:order 1 .

nodes:f0d14635-879d-44ff-ae9b-2c34ed278f8a
    a form:Field;
    form:displayType display:aggregateField;
    form:help
    "Dit is de som van al de velden in de tabel voor kolom \"Bedrag in euro\"";
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75;
    xsd:target ( ext:Expense ext:amount );
    sh:name "Totale uitgaven";
    sh:order 2;
    sh:path nodes:bb4c2c15-efad-4f87-9504-76960bb63978 .

emb:source-node
    a form:Form, form:TopLevelForm;
    form:includes
        nodes:3d561f39-85dd-441d-a2a6-98826e6e1dc8,
        nodes:f0d14635-879d-44ff-ae9b-2c34ed278f8a;
    form:partOf nodes:a4503b20-7c8f-497c-abac-9650691cec75 .

ext:expenseGenerator
    a form:Generator;
    form:dataGenerator form:addMuUuid;
    form:prototype [ form:shape [ a ext:Expense; ext:amount 0.0 ] ].

ext:expenseS a form:Scope; sh:path ext:Expense.
```
