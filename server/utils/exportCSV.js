const { Parser } = require('json2csv');

const exportToCSV = (data, fields) => {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (err) {
    throw new Error('Failed to generate CSV: ' + err.message);
  }
};

module.exports = exportToCSV;
