import RightOrderPanel from './RightOrderPanel';

/**
 * OrderModal (Floating Screen Mode)
 * ---------------------------------------------------------------------------
 * Re-uses the unified RightOrderPanel in 'overlay' mode to achieve 0% code redundancy,
 * conforming 1:1 to the Figma Overlay screens (Buy_Delivery_Market, Buy_Delivery_Limit, Buy_Delivery_Trigger).
 */
export const OrderModal = ({
  isOpen,
  action = 'BUY',
  stock,
  productType = 'Long-term',
  onClose,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  return (
    <RightOrderPanel
      stock={stock}
      action={action}
      initialProductType={productType}
      initialViewMode="overlay"
      onClose={onClose}
      onSubmitOrder={onSubmitOrder}
    />
  );
};

export default OrderModal;
