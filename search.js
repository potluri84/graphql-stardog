const { ApolloServer,gql} = require('apollo-server');
const fetch = require('node-fetch')
const {
    Connection,
    query
} = require('stardog');
const newEngine = require('@comunica/actor-init-sparql').newEngine;
const myEngine = newEngine();
const { dispatchQuery } = require('./graphdb');

const typeDefs = gql `
  
type taxonomy {
    name: String
}

  type searchResult @cacheControl(maxAge: 240) {
    term: String
    results: [result]
  }

  type result @cacheControl(maxAge: 240) {
      uri: String
      label: String
      types: [typesOf]
      matches: [match]  
  }

  type typesOf @cacheControl(maxAge: 240) {
      uri: String
  }

 type match @cacheControl(maxAge: 240) {
     propertyUri: String
     string: String
 }

 type results @cacheControl(maxAge: 240) {
     uri: String
     type: String
     property: String
     string: String
 }

 type autoSearchResults @cacheControl(maxAge: 240) {
     matches: String
     classType: String
 }

 type generalSearchResults @cacheControl(maxAge: 240) {
          matches: String
               type: String
               uri: String


 }

  type Query {
      search(text: String): searchResult!
      searchUsingSparQL(text: String): [results]!
      searchUsingSparQLDemo(text: String): [results]!
      autoSearch(text: String, type: String): [autoSearchResults]!
      generalSearch(text: String, type: String, limit: Int, offset: Int): [generalSearchResults]!
      graphdb(text: String): String

  }

type schema {
    query: Query
}

`;

const baseURL =`http://localhost:5820/annex/appmon/search`

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:7200/repositories/appmon',
});


const resolvers = {
    Query: {
        graphdb: (parent,args) => {
           /* return myEngine.query('PREFIX : <http://www.ontotext.com/connectors/lucene#> ' +
                    'PREFIX inst: <http://www.ontotext.com/connectors/lucene/instance#>'+
                    ' SELECT ?entity ?snippetField ?snippetText {'+
                     '   ?search a inst:text_index; '+
                     '  :query "Auto finance" ; :entities ?entity. ' +
                      '      ?entity :snippets _:s . _:s :snippetField ?snippetField; :snippetText ?snippetText.}', {
                        sources: [{
                            type: 'sparql',
                            value: 'http://localhost:7200/repositories/appmon'
                        }]
                    }).then(function (result) {
                        result.bindingsStream.on('data', function (data) {
                            console.log(data.toObject());
                        });
                                                    return "dine";
                    });*/
                   var sparql = "select * { ?s ?p ?o }";
                   return dispatchQuery('http://localhost:7200/repositories/appmon', sparql).then(({
                       body
                   }) => {
                       console.log(body.results.bindings)
                       return body.results.bindings;
                   });;
        },
        search: (parent,args) => 
        {
            const { text } = args
            return fetch(`${baseURL}/${text}`,{
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic YWRtaW46YWRtaW4="
                }}).then(res => res.json())
        },
        searchUsingSparQL: (parent, args) => {
            const { text } = args
            console.log(`${text}`)
            var sparql = "SELECT  (?type as ?types) (?s as ?uri) (group_concat(?p;separator='|') as ?property)"
                + " (group_concat(?l;separator='|') as ?string)"
                + " WHERE { ?s ?p ?l."
                + " (?l ?score) <tag:stardog:api:property:textMatch> '" + `${text}` + "'."
                + " ?s rdf:type ?type }"
                + " group by ?type ?s ";
            console.log(sparql)
            return query.execute(conn, 'appmon', sparql,
             'application/sparql-results+json',
              {
                limit: 10,
                offset: 0,
                }).then(({ body }) => {
                    var sdResult = new SDResult(body.results.bindings)
                    var res = sdResult.convertToSearchResults();
                    return res;
                });
        },
        searchUsingSparQLDemo: (parent, args) => {
            return fakeResults;
        },
        autoSearch: (parent, args) => {
            console.log(args.text)
            var sparql = "SELECT DISTINCT ?matches ?type"
            +" WHERE { ?matches stardog:property:textMatch '" + args.text + "'."
            +" ?entity a ?type }";
            console.log(sparql)
            return query.execute(conn, 'appmon', sparql,
                'application/sparql-results+json', {
                    limit: 10,
                    offset: 0,
                }).then(({body
            }) => {
                return body.results.bindings;
            });
        },
generalSearch: (parent, args) => {
    console.log(args.text)
    var sparql = "SELECT DISTINCT ?matches ?property (?entity as ?uri) ?type"  +
        " WHERE { ?matches stardog:property:textMatch '" + args.text + "'." +
        " ?entity ?property ?matches. ?entity rdf:type ?type }";
    console.log(sparql)
    return query.execute(conn, 'appmon', sparql,
        'application/sparql-results+json', {
            limit: args.limit,
            offset: args.offset,
        }).then(({
        body
    }) => {
        return body.results.bindings;
    });
}
    },
    results: {
        uri: (root) => root.uri,
        type: (root) => root.type,
        property: (root) => root.property,
        string: (root) => root.string
    },
    autoSearchResults: {
        matches: (root) => root.matches.value,
        classType: (root) => root.type.value
    },
    generalSearchResults: {
        matches: (root) => root.matches.value,
        type: (root) => root.type.value,
        uri: (root) => root.uri.value

    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    engine: {
        apiKey: "service:potluri84-9450:YHF-SuKCiE3Uz6bW8kef8g"
    },
    tracing:true,
    cacheControl:true
});

server.listen().then(({
    url
}) => {
    console.log(`🚀  Server ready at ${url}`);
});


var searchResults = {
            "term": "Ramu*",
            "results": [{
                "uri": "http://example.org/123334",
                "label": null,
                "types": [{
                    "uri": "http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#Contact"
                }],
                "matches": [{
                        "propertyUri": "http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#Email",
                        "string": "ramu@gmail.com"
                    },
                    {
                        "propertyUri": "http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#FirstName",
                        "string": "Ramu"
                    }
                ]
            }]
        }

var fakeResults = [{
        uri: 'http://example.org/123334',
        types: 'http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#FirstName|http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#Email',
        string: 'Ramu|ramu@gmail.com'
},
{
    uri: 'http://example.org/123334',
    types: 'http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#FirstName|http://www.semanticweb.org/krishnapotluri/ontologies/2018/8/appmon.owl#Email',
    string: 'Ramu|ramu@gmail.com'
}]

class SDResult {
    
    constructor(res)
    {
        this.res = res;
    }

    convertToSearchResults()
    {
        var convert = [];
        this.res.forEach(element => {
            var result = new Object();
            result.uri = element.uri.value;
            result.type = element.types.value;
            result.property = element.property.value;
            result.string = element.string.value;
            convert.push(result);
        });
        return convert;
    }
}

