// The table and the clickable numbers used by the PMO and Management dashboards.

export const Table = ({ id, title, head, rows, empty }) => {
  return (
    <section className="panel" id={id}>
      <h3 className="panel-title">{title}</h3>
      <div className="table">
        <table className="static">
          <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows}</tbody>
        </table>
        {!rows.length && <p className="empty muted">{empty}</p>}
      </div>
    </section>
  );
};

export const Numbers = ({ items, onGo }) => {
  return (
    <section className="metrics">
      {items.map((m) => (
        <button type="button" key={m.label} className={`card ${m.tone ?? ''}`}
          onClick={() => onGo(m.target)}>
          {m.label}<strong>{m.value}</strong>
        </button>
      ))}
    </section>
  );
};
