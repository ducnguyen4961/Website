"use client";

import { useEffect, useState } from "react";
import Select from "react-select";

function DeviceSelector({ slaveid, selectedDevices, setSelectedDevices }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = slaveid.map((id) => ({ value: id, label: id }));

  if (!mounted) return null;

  return (
    <div className="mb-4">
      <Select
        options={options}
        isMulti
        value={
          Array.isArray(selectedDevices)
            ? selectedDevices.map((d) => ({ value: d, label: d }))
            : []
        }
        onChange={(selectedOptions) => {
          setSelectedDevices(selectedOptions.map((option) => option.value));
        }}
        placeholder="May select just a device or more"
      />
    </div>
  );
}

export default DeviceSelector;
