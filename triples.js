'use strict';

function Triples(db) {

  async function put(subject, predicate, object) {

    if (!subject || !predicate || !object) {
      throw ('The subject, predicate, and object parameters are required.');
    }

    let data = {
      "subject": isNaN(subject) ? subject.toString() : parseFloat(subject),
      "predicate": isNaN(predicate) ? predicate.toString() : parseFloat(predicate),
      "object": isNaN(object) ? object.toString() : parseFloat(object)
    };

    let spo = {"key":"spo::" + subject + "::" + predicate + "::" + object, "value":data};
    let sop = {"key":"sop::" + subject + "::" + object + "::" + predicate, "value":data};
    let ops = {"key":"ops::" + object + "::" + predicate + "::" + subject, "value":data};
    let osp = {"key":"osp::" + object + "::" + subject + "::" + predicate, "value":data};
    let pso = {"key":"pso::" + predicate + "::" + subject + "::" + object, "value":data};
    let pos = {"key":"pos::" + predicate + "::" + object + "::" + subject, "value":data};
    let write = await db.importDB([spo,sop,ops,osp,pso,pos]);
    return true;

  }

  async function del(subject, predicate, object) {

    if (!subject || !predicate || !object) {
      throw ('The subject, predicate, and object parameters are required.');
    }

    let spo = "spo::" + subject + "::" + predicate + "::" + object;
    let sop = "sop::" + subject + "::" + object + "::" + predicate;
    let ops = "ops::" + object + "::" + predicate + "::" + subject;
    let osp = "osp::" + object + "::" + subject + "::" + predicate;
    let pso = "pso::" + predicate + "::" + subject + "::" + object;
    let pos = "pos::" + predicate + "::" + object + "::" + subject;
    let remove = await db.del([spo,sop,ops,osp,pso,pos]);
    return true;

  }

  async function get(subject, predicate, object) {
    let key = "spo::" + subject + "::" + predicate + "::" + object;
    let exists = await db.get(key);
    if (exists.value) {
      let result = exists.value;
      return {
        "key":exists.key,
        "mode":"spo",
        "subject":result.subject,
        "predicate":result.predicate,
        "object":result.object
      };
    } else {
      return null;
    }
  }

  async function list(subject, predicate, object) {

    let search = [];
    let prefix = [];
    let query = {
      subject,
      predicate,
      object
    };

    for (let i in query) {
      if (query[i]) {
        prefix.push(i[0]);
        search.push(query[i]);
      }
    }

    if (!query.subject) {
      prefix.push("s");
    }
    if (!query.predicate) {
      prefix.push("p");
    }
    if (!query.object) {
      prefix.push("o");
    }

    let gt = '\x00';
    let lt = '\xff';

    let q = prefix.join('') + "::" + search.join('::') + "::";

    if (search && search.length > 0) {
      gt = q;
      lt = q + "\xff";
    }

    if (search.length === 3) {
      let result = await db.get(q.slice(0, -2));
      let key = result.key.split('::');
      if (result && result.value) {
        return [{"key":result.key, "mode":key[0], "subject":result.value.subject, "predicate":result.value.predicate, "object":result.value.object}];
      } else {
        return [];
      }
    }

    return await db.list({
      gt,
      lt,
      "values":true
    }).then(results => {
      return results.map(result => {
        let key = result.key.split('::');
        return {"key":result.key, "mode": key[0], "subject":result.value.subject, "predicate":result.value.predicate, "object":result.value.object};
      });
    });

  }

  let triples = {
    put,
    get,
    del,
    list
  };
  return triples;

}

if (typeof module !== 'undefined' && module && module.exports) {
  module.exports = Triples;
}
