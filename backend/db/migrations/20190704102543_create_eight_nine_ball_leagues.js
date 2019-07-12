exports.up = function(knex) {
  return knex.schema.createTable("eight_nine_ball_leagues", table => {
    table.primary(["seasonId", "staffName", "type"]);
    table.integer("seasonId").notNullable();
    table.string("staffName").notNullable();
    table.integer("type").notNullable();
    table.integer("play").defaultTo(0);
    table.integer("win").defaultTo(0);
    table.integer("draw").defaultTo(0);
    table.integer("lose").defaultTo(0);
    table.integer("goalsFor").defaultTo(0);
    table.integer("goalsAgainst").defaultTo(0);
    table.integer("points").defaultTo(0);

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("eight_nine_ball_leagues");
};