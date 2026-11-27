# SANA NET - RouterOS v6 only (6.46 through 6.49.x)
# Creates missing Hotspot user profiles only. Existing profiles/users are not changed.
# Rates are upload/download as interpreted by RouterOS Hotspot user profile rate-limit.
:local rosVersion [/system resource get version]
:if ([:pick $rosVersion 0 2] != "6.") do={
  :put ("ERROR: This installer is for RouterOS 6.x only. Detected: " . $rosVersion)
  :error "SANA NET RouterOS 6 installer stopped"
}

:if ([:len [/ip hotspot user profile find where name="sana-light"]] = 0) do={
  /ip hotspot user profile add name="sana-light" rate-limit="2M/1M" shared-users=1
}
:if ([:len [/ip hotspot user profile find where name="sana-medium"]] = 0) do={
  /ip hotspot user profile add name="sana-medium" rate-limit="5M/2M" shared-users=1
}
:if ([:len [/ip hotspot user profile find where name="sana-fast"]] = 0) do={
  /ip hotspot user profile add name="sana-fast" rate-limit="10M/3M" shared-users=1
}
:if ([:len [/ip hotspot user profile find where name="sana-high"]] = 0) do={
  /ip hotspot user profile add name="sana-high" rate-limit="20M/5M" shared-users=1
}

:put ("SANA NET four speed profiles checked/created on RouterOS " . $rosVersion)
/ip hotspot user profile print where name~"sana-"
