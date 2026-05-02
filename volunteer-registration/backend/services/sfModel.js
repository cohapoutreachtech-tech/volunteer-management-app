const sf = require('./salesforce');

class SFQuery {
  constructor(model, filter) {
    this.model = model;
    this.filter = filter;
    this._populate = [];
  }
  populate(field) {
    this._populate.push(field);
    return this;
  }
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
  async exec() {
    const fields = await this.model.getFields();
    let soql = `SELECT ${fields.join(', ')} FROM ${this.model.sobject}`;
    if (this.filter && Object.keys(this.filter).length > 0) {
      const where = Object.entries(this.filter).map(([k, v]) => {
        if (v === null) return `${k} = null`;
        if (typeof v === 'string') return `${k} = '${String(v).replace(/'/g, "\\'")}'`;
        return `${k} = ${v}`;
      }).join(' AND ');
      soql += ` WHERE ${where}`;
    }
    // Use jsforce autoFetch to retrieve more than 2000 records when needed
    const conn = await sf.connect();
    const res = await conn.query(soql, { autoFetch: true, maxFetch: 10000 });
    let records = res.records || [];
    // Remove attributes property returned by jsforce
    records = records.map(r => {
      const copy = { ...r };
      delete copy.attributes;
      return copy;
    });
    if (this._populate.length > 0) {
      for (const p of this._populate) {
        await this.model._populateField(records, p);
      }
    }
    return records;
  }
}

class SFModel {
  constructor(sobject) {
    this.sobject = sobject;
    this._fields = null;
    // mapping of common lookup fields to sobjects
    this.lookupMap = {
      Volunteer__c: process.env.SF_SOBJECT_VOLUNTEER || 'Volunteer__c',
      Event__c: process.env.SF_SOBJECT_EVENT || 'Event__c',
      Registration__c: process.env.SF_SOBJECT_REGISTRATION || 'Registration__c',
      VolunteerHours__c: process.env.SF_SOBJECT_VOLUNTEERHOURS || 'VolunteerHours__c'
    };
  }

  async getFields() {
    if (this._fields) return this._fields;
    const conn = await sf.connect();
    const desc = await conn.sobject(this.sobject).describe();
    // pick a subset useful for API; include Id and Name always
    const fields = desc.fields.map(f => f.name);
    this._fields = fields;
    return fields;
  }

  find(filter = {}) {
    return new SFQuery(this, filter);
  }

  async findOne(filter = {}) {
    const q = new SFQuery(this, filter);
    const rows = await q.exec();
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async findById(id) {
    const conn = await sf.connect();
    try {
      const rec = await conn.sobject(this.sobject).retrieve(id);
      const copy = { ...rec };
      delete copy.attributes;
      return copy;
    } catch (err) {
      return null;
    }
  }

  async create(data) {
    const res = await sf.create(this.sobject, data);
    return res; // { id, success, errors }
  }

  async insertMany(arr) {
    const results = [];
    for (const d of arr) {
      const r = await this.create(d);
      results.push(r);
    }
    return results;
  }

  async countDocuments(filter = {}) {
    if (Object.keys(filter).length === 0) {
      const conn = await sf.connect();
      const res = await conn.query(`SELECT Id FROM ${this.sobject}`);
      return res.totalSize || (res.records && res.records.length) || 0;
    }
    const rows = await this.find(filter).exec();
    return rows.length;
  }

  async deleteMany(filter = {}) {
    // If empty filter, delete all
    const rows = await this.find(filter).exec();
    const conn = await sf.connect();
    const ids = rows.map(r => r.Id || r.id);
    const results = [];
    for (const id of ids) {
      try {
        const r = await conn.sobject(this.sobject).destroy(id);
        results.push(r);
      } catch (err) {
        results.push({ success: false, error: err });
      }
    }
    return results;
  }

  async findByIdAndUpdate(id, data, options = {}) {
    await sf.update(this.sobject, id, data);
    // return the updated record
    return this.findById(id);
  }

  async findByIdAndDelete(id) {
    await sf.delete(this.sobject, id);
    return { id };
  }

  // helper to populate a single field across records
  async _populateField(records, field) {
    if (!records || records.length === 0) return;
    const map = this.lookupMap;
    const targetSObject = map[field] || field; // fallback to field name
    const ids = [...new Set(records.map(r => r[field]).filter(Boolean))];
    if (ids.length === 0) return;
    const conn = await sf.connect();
    // get fields for target
    let targetFields = ['Id'];
    try {
      const desc = await conn.sobject(targetSObject).describe();
      targetFields = desc.fields.map(f => f.name);
    } catch (err) {
      // fallback: just retrieve Id
      targetFields = ['Id'];
    }
    // batch retrieve by ids (jsforce retrieve only supports single id), use query
    const soql = `SELECT ${targetFields.join(', ')} FROM ${targetSObject} WHERE Id IN ('${ids.join("','")}')`;
    const res = await conn.query(soql);
    const mapById = {};
    (res.records || []).forEach(r => { const c = { ...r }; delete c.attributes; mapById[r.Id] = c; });
    // replace id with object
    records.forEach(r => {
      if (r[field]) r[field] = mapById[r[field]] || r[field];
    });
  }
}

module.exports = function(sobjectName) {
  return new SFModel(sobjectName);
};
