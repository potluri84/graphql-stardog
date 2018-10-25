const { ApolloServer,gql} = require('apollo-server');
const fetch = require('node-fetch')
const {
    Connection,
    query
} = require('stardog');

const typeDefs = gql `
  
type taxonomy {
    name: String
}

  type searchResult {
    term: String
    results: [result]
  }

  type result {
      uri: String
      label: String
      types: [typesOf]
      matches: [match]  
  }

  type typesOf {
      uri: String
  }

 type match {
     propertyUri: String
     string: String
 }

 type results {
     uri: String
     type: String
     property: String
     string: String
 }

 type autoSearchResults {
     matches: String
     classType: String
 }

  type Query {
      search(text: String): searchResult!
      searchUsingSparQL(text: String): [results]!
      searchUsingSparQLDemo(text: String): [results]!
      autoSearch(text: String, type: String): [autoSearchResults]!

  }

type schema {
    query: Query
}

`;

const baseURL =`http://localhost:5820/annex/appmon/search`

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
});


const resolvers = {
    Query: {
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
                    console.log(res);
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
                console.log(body.results.bindings);
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
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers
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

