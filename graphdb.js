const fetch = require('node-fetch');
const qs = require('querystring');
const {
    httpBody
} = require('./response-transform');





const dispatchQuery = (url, query) => {
    console.log(query)
    return fetch(url, {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            headers: {
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: qs.stringify({
                query: query
            })
        }).then(httpBody)
        .then(res => {
if (res.body && res.body.head && res.body.head.vars) {
    res.body.head.vars = [...new Set(res.body.head.vars)];
}
return res;
});
};

module.exports = {
    dispatchQuery
};
