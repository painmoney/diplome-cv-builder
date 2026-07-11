import { Box, Card, CardContent } from "@mui/material";
import DragIndicator from "@mui/icons-material/DragIndicator";
import { Reorder, useDragControls } from "framer-motion";

export default function ReorderCard({
  value,
  dragLabel,
  children,
  variant,
  cardSx,
  contentSx,
  containerSx,
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={value}
      dragControls={dragControls}
      dragListener={false}
      whileDrag={{
        scale: 1.015,
        zIndex: 20,
        boxShadow: "0 18px 45px rgba(8, 15, 34, 0.24)",
      }}
      transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.8 }}
      style={{ listStyle: "none", position: "relative", borderRadius: 8 }}
    >
      <Card
        variant={variant}
        sx={{
          transition: "box-shadow 160ms ease, border-color 160ms ease",
          ...cardSx,
        }}
      >
        <CardContent sx={contentSx}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              ...containerSx,
            }}
          >
            <Box
              onPointerDown={(event) => dragControls.start(event)}
              aria-label={dragLabel}
              title="Перетащить"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "stretch",
                width: 28,
                borderRadius: 1,
                color: "text.secondary",
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                transition: "background-color 140ms ease, color 140ms ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  color: "primary.main",
                },
                "&:active": { cursor: "grabbing" },
              }}
            >
              <DragIndicator fontSize="small" />
            </Box>

            {children}
          </Box>
        </CardContent>
      </Card>
    </Reorder.Item>
  );
}
