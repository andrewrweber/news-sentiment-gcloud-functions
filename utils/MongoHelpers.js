function buildEntityAggregateQuery(orgId, startTime, endTime) {
  return (
    [
      {
        $match: {
          name: { $not: {$size: 0} },
          orgId: {$eq: orgId},
          created_at: {$gte: startTime, $lt: endTime}
        }
      },
      { $unwind: '$name' },
      {
        $group: {
          _id: {$toLower: '$name'},
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gte: 2 }
        }
      },
      { $sort : { count : -1} },
      { $limit : 1000 }
    ]
  );
}

module.exports.buildEntityAggregateQuery = buildEntityAggregateQuery;