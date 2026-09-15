import { useMemo, useState } from "react";
import { Autocomplete, Box, Button, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { KEEP_CURRENT } from "../../imageImport/matcher";
import type { Match } from "../../imageImport/recognition";
import type { EmojiMaps } from "../../emoji/types";
import { SlotType } from "../../schemas/slot-type";
import { UI_TO_EQUIPMENT_SLOT_LABEL } from "../PresetEditor/equipmentSlots";
import { useEmojiFilter } from "../EmojiSelectDialog/useEmojiFilter";

export const slotLabel = (match: Pick<Match, "group" | "index">) => match.group === "inventory"
  ? `Inventory ${match.index + 1}`
  : `Equipment: ${UI_TO_EQUIPMENT_SLOT_LABEL[match.index]}`;

interface Props {
  matches: Match[];
  maps: EmojiMaps;
  onSelect: (match: Match, id: string) => void;
  onContribute?: (match: Match) => void;
}

function ManualSearch({ match, maps, onSelect }: { match: Match; maps: EmojiMaps; onSelect: (id: string) => void }) {
  const filter = useEmojiFilter({ maps, slotType: match.group === "inventory" ? SlotType.Inventory : SlotType.Equipment,
    slotIndex: match.index, selectedIndices: [], slotKey: "" });
  return <Autocomplete size="small" options={filter.options} value={null}
    isOptionEqualToValue={(a, b) => a.id === b.id}
    filterOptions={(options, state) => {
      const query = state.inputValue.trim().toLowerCase();
      const aliases = query ? options.filter(option =>
        maps.byId[option.id]?.id_aliases?.some(alias => alias.includes(query))) : [];
      const ranked = filter.filterOptions(options, state);
      return [...aliases, ...ranked].filter((option, index, all) =>
        all.findIndex(other => other.id === option.id) === index).slice(0, 50);
    }}
    getOptionLabel={option => maps.byId[option.id]?.name ?? option.id}
    onChange={(_, value) => { if (value) onSelect(value.id); }}
    renderOption={(props, option) => <li {...props} key={option.id}>
      <Box component="img" src={maps.getUrl(option.id)} alt="" loading="lazy"
        sx={{ width: 28, height: 28, objectFit: "contain", mr: 1 }} />
      {maps.byId[option.id]?.name ?? option.id}
    </li>}
    renderInput={params => <TextField {...params} autoFocus label={`Search ${slotLabel(match)}`} placeholder="Item name or alias" />}
  />;
}

function ReviewRow({ match, maps, onSelect, onContribute }: { match: Match; maps: EmojiMaps; onSelect: (id: string) => void; onContribute?: () => void }) {
  const [searching, setSearching] = useState(false);
  const choices = useMemo(() => Array.from(new Set([KEEP_CURRENT, "", ...match.candidates.map(c => c.id), match.selected])), [match]);
  const itemName = (id: string) => id === KEEP_CURRENT ? "Keep current" : id ? maps.byId[id]?.name ?? id : "Empty slot";
  return <Stack spacing={1} sx={{ py: 1.5 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box component="img" src={match.thumbnail} alt={`${slotLabel(match)} screenshot`}
        sx={{ width: 40, height: 40, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />
      <TextField select fullWidth size="small" label={slotLabel(match)} value={match.selected}
        onChange={event => onSelect(event.target.value)}>
        {choices.map(id => <MenuItem key={id} value={id}>{itemName(id)}</MenuItem>)}
      </TextField>
      <Box sx={{ width: 36, flexShrink: 0 }}>
        {match.selected && match.selected !== KEEP_CURRENT &&
          <Box component="img" src={maps.getUrl(match.selected)} alt={itemName(match.selected)} loading="lazy"
            sx={{ width: 32, height: 32, objectFit: "contain" }} />}
      </Box>
      <Button size="small" onClick={() => setSearching(value => !value)} aria-label={`Search items for ${slotLabel(match)}`}>
        {searching ? "Close" : "Search"}
      </Button>
    </Stack>
    {searching && <ManualSearch match={match} maps={maps} onSelect={id => { onSelect(id); setSearching(false); }} />}
    {onContribute && (!match.confident || searching) && <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={onContribute}>Item missing? Suggest it</Button>}
  </Stack>;
}

export function MatchReview({ matches, maps, onSelect, onContribute }: Props) {
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">
      Check doses, colours and variants. Uncertain matches start as Keep current. Search to choose a different item.
    </Typography>
    {[false, true].map(confident => {
      const group = matches.filter(match => match.confident === confident);
      if (!group.length) return null;
      return <Box key={String(confident)} component="section" aria-label={confident ? "Confident matches" : "Needs checking"}>
        <Divider textAlign="left"><Typography variant="subtitle2" color={confident ? "text.secondary" : "warning.main"}>
          {confident ? "Confident matches" : "Needs checking"} ({group.length})
        </Typography></Divider>
        {group.map(match => <ReviewRow key={`${match.group}-${match.index}`} match={match} maps={maps}
          onSelect={id => onSelect(match, id)} onContribute={onContribute ? () => onContribute(match) : undefined} />)}
      </Box>;
    })}
  </Stack>;
}
