import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Edit, CreditCard, Banknote, Smartphone, Wallet, Info, Printer, MessageCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  method: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  details?: string;
  cardType?: string;
  lastFour?: string;
  upiId?: string;
  walletType?: string;
}

interface WalletBalance {
  total: number;
  rewardPoints: number;
  refundBalance: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: (payments: Payment[]) => void;
  walletBalance?: WalletBalance;
  customerPhone?: string;
  invoiceNumber?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentComplete,
  walletBalance = { total: 350, rewardPoints: 150, refundBalance: 200 },
  customerPhone = "+91 98765 43210",
  invoiceNumber = "INV-2024-001",
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeMethod, setActiveMethod] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [amount, setAmount] = useState<string>('');
  const [cardType, setCardType] = useState<string>('');
  const [lastFour, setLastFour] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [showWalletBreakdown, setShowWalletBreakdown] = useState<boolean>(false);
  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);
  const { toast } = useToast();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  const quickAmounts = [100, 500, 2000];

  // Wallet redemption functions
  const validateWalletAmount = useCallback((amt: string) => {
    const numAmount = parseFloat(amt);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return false;
    }
    if (numAmount > walletBalance.total) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `Amount cannot exceed available wallet balance of ₹${walletBalance.total}`,
        variant: "destructive"
      });
      return false;
    }
    if (numAmount > remainingBalance) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Amount cannot exceed remaining balance of ₹${remainingBalance}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [walletBalance.total, remainingBalance, toast]);

  const useFullWalletBalance = useCallback(() => {
    const maxAmount = Math.min(walletBalance.total, remainingBalance);
    setRedeemAmount(maxAmount.toString());
  }, [walletBalance.total, remainingBalance]);

  const useOnlyPoints = useCallback(() => {
    const maxAmount = Math.min(walletBalance.rewardPoints, remainingBalance);
    setRedeemAmount(maxAmount.toString());
  }, [walletBalance.rewardPoints, remainingBalance]);

  const useRefundBalance = useCallback(() => {
    const maxAmount = Math.min(walletBalance.refundBalance, remainingBalance);
    setRedeemAmount(maxAmount.toString());
  }, [walletBalance.refundBalance, remainingBalance]);

  const resetForm = useCallback(() => {
    setAmount('');
    setCardType('');
    setLastFour('');
    setUpiId('');
    setWalletType('');
    setRedeemAmount('');
  }, []);

  const validateAmount = useCallback((amt: string) => {
    const numAmount = parseFloat(amt);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return false;
    }
    if (numAmount > remainingBalance) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Amount cannot exceed remaining balance of ₹${remainingBalance}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [remainingBalance, toast]);

  const addPayment = useCallback(() => {
    const isWalletPayment = activeMethod === 'wallet';
    const paymentAmount = isWalletPayment ? redeemAmount : amount;
    
    if (isWalletPayment && !validateWalletAmount(paymentAmount)) return;
    if (!isWalletPayment && !validateAmount(paymentAmount)) return;

    const numAmount = parseFloat(paymentAmount);
    let details = '';

    switch (activeMethod) {
      case 'card':
        if (!cardType) {
          toast({
            title: "Card Type Required",
            description: "Please select a card type",
            variant: "destructive"
          });
          return;
        }
        details = `${cardType}${lastFour ? ` ****${lastFour}` : ''}`;
        break;
      case 'upi':
        details = upiId || '';
        break;
      case 'wallet':
        const pointsUsed = Math.min(numAmount, walletBalance.rewardPoints);
        const refundUsed = numAmount - pointsUsed;
        details = pointsUsed > 0 && refundUsed > 0 
          ? `${pointsUsed} pts + ₹${refundUsed} refund used`
          : pointsUsed > 0 
            ? `${pointsUsed} pts used`
            : `₹${refundUsed} refund used`;
        break;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      method: activeMethod,
      amount: numAmount,
      details,
      ...(activeMethod === 'card' && { cardType, lastFour }),
      ...(activeMethod === 'upi' && { upiId }),
    };

    setPayments(prev => [...prev, newPayment]);
    resetForm();
    
    toast({
      title: "Payment Added",
      description: `₹${numAmount} payment added successfully`,
    });
  }, [amount, redeemAmount, activeMethod, cardType, lastFour, upiId, validateAmount, validateWalletAmount, walletBalance, resetForm, toast]);

  const deletePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Payment Removed",
      description: "Payment has been removed from the list",
    });
  }, [toast]);

  const confirmPayment = useCallback(() => {
    if (remainingBalance > 0) {
      toast({
        title: "Payment Incomplete",
        description: `₹${remainingBalance} still remaining to be paid`,
        variant: "destructive"
      });
      return;
    }
    
    onPaymentComplete(payments);
    
    // Handle delivery options
    if (selectedDeliveryOptions.length > 0) {
      selectedDeliveryOptions.forEach(option => {
        switch (option) {
          case 'print':
            handlePrintInvoice();
            break;
          case 'whatsapp':
            handleWhatsAppShare();
            break;
          case 'sms':
            handleSMSShare();
            break;
        }
      });
    }
    
    toast({
      title: "Payment Successful",
      description: `Total amount of ₹${totalAmount} has been paid successfully`,
    });
  }, [remainingBalance, payments, totalAmount, onPaymentComplete, toast, selectedDeliveryOptions]);

  const fillRemainingAmount = useCallback(() => {
    setAmount(remainingBalance.toString());
  }, [remainingBalance]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'wallet': return <Wallet className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'cash': return 'text-payment-cash';
      case 'card': return 'text-payment-card';
      case 'upi': return 'text-payment-upi';
      case 'wallet': return 'text-payment-wallet';
      default: return 'text-muted-foreground';
    }
  };

  const handlePrintInvoice = useCallback(() => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto;">
        <h2 style="text-align: center;">INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Customer:</strong> ${customerPhone}</p>
        <hr>
        <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
        <h3>Payment Details:</h3>
        ${payments.map(p => `<p>${p.method.charAt(0).toUpperCase() + p.method.slice(1)}: ₹${p.amount}${p.details ? ` (${p.details})` : ''}</p>`).join('')}
        <hr>
        <p style="text-align: center;">Thank you for your business!</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    
    toast({
      title: "Invoice Printed",
      description: "Invoice has been sent to printer",
    });
  }, [invoiceNumber, customerPhone, totalAmount, payments, toast]);

  const handleWhatsAppShare = useCallback(() => {
    const message = `🧾 *INVOICE*\n\n📋 Invoice No: ${invoiceNumber}\n📅 Date: ${new Date().toLocaleDateString()}\n💰 Total Amount: ₹${totalAmount}\n\n💳 *Payment Details:*\n${payments.map(p => `${p.method.charAt(0).toUpperCase() + p.method.slice(1)}: ₹${p.amount}${p.details ? ` (${p.details})` : ''}`).join('\n')}\n\n✅ Payment Status: PAID\n\nThank you for your business! 🙏`;
    
    const whatsappUrl = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: "Invoice details ready to send via WhatsApp",
    });
  }, [invoiceNumber, totalAmount, payments, customerPhone, toast]);

  const handleSMSShare = useCallback(() => {
    const message = `INVOICE ${invoiceNumber}\nDate: ${new Date().toLocaleDateString()}\nTotal: ₹${totalAmount}\nPayments: ${payments.map(p => `${p.method} ₹${p.amount}`).join(', ')}\nStatus: PAID\nThank you!`;
    
    const smsUrl = `sms:${customerPhone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
    
    toast({
      title: "SMS App Opened",
      description: "Invoice details ready to send via SMS",
    });
  }, [invoiceNumber, totalAmount, payments, customerPhone, toast]);

  const toggleDeliveryOption = useCallback((option: string) => {
    setSelectedDeliveryOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Payment</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Bill Summary */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold">₹{totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-2xl font-bold text-success">₹{totalPaid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remainingBalance === 0 ? 'text-success' : 'text-warning'}`}>
                  ₹{remainingBalance}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setShowWalletBreakdown(!showWalletBreakdown)}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-2xl font-bold text-primary">₹{walletBalance.total}</p>
                {showWalletBreakdown && (
                  <div className="mt-2 p-2 bg-background rounded-md text-xs">
                    <p className="text-muted-foreground">Reward Points: {walletBalance.rewardPoints} pts (₹{walletBalance.rewardPoints})</p>
                    <p className="text-muted-foreground">Refund Balance: ₹{walletBalance.refundBalance}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="upi" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              UPI
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <Label className="text-sm font-medium">Quick Amount:</Label>
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  disabled={amt > remainingBalance}
                >
                  ₹{amt}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={fillRemainingAmount}
                disabled={remainingBalance === 0}
              >
                Remaining (₹{remainingBalance})
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Method-specific inputs */}
            <TabsContent value="cash" className="space-y-4 mt-0">
              {amount && (
                <div className="p-3 bg-success-light rounded-lg">
                  <p className="text-sm text-muted-foreground">Change to return:</p>
                  <p className="text-lg font-semibold">
                    ₹{Math.max(0, parseFloat(amount || '0') - remainingBalance)}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="card" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type *</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="rupay">RuPay</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastFour">Last 4 Digits (Optional)</Label>
                  <Input
                    id="lastFour"
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID / Reference No.</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="user@paytm or transaction reference"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium">Available Balance: ₹{walletBalance.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {walletBalance.rewardPoints} pts + ₹{walletBalance.refundBalance} refund
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="redeemAmount">Enter Amount to Redeem</Label>
                  <Input
                    id="redeemAmount"
                    type="number"
                    placeholder="Enter redeem amount"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Redeem Options:</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={useFullWalletBalance}
                      disabled={remainingBalance === 0 || walletBalance.total === 0}
                      className="text-xs"
                    >
                      Use Full Balance
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={useOnlyPoints}
                      disabled={remainingBalance === 0 || walletBalance.rewardPoints === 0}
                      className="text-xs"
                    >
                      Use Only Points
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={useRefundBalance}
                      disabled={remainingBalance === 0 || walletBalance.refundBalance === 0}
                      className="text-xs"
                    >
                      Use Refund Balance
                    </Button>
                  </div>
                </div>

                {redeemAmount && parseFloat(redeemAmount) > 0 && (
                  <div className="p-3 bg-success/5 rounded-lg">
                    <p className="text-sm font-medium text-success">
                      Redeeming: ₹{parseFloat(redeemAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(redeemAmount) <= walletBalance.rewardPoints 
                        ? `${parseFloat(redeemAmount)} pts used`
                        : `${walletBalance.rewardPoints} pts + ₹${parseFloat(redeemAmount) - walletBalance.rewardPoints} refund used`
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <Button 
              onClick={addPayment} 
              className="w-full"
              disabled={
                remainingBalance === 0 || 
                (activeMethod === 'wallet' ? !redeemAmount : !amount)
              }
            >
              {activeMethod === 'wallet' ? 'Add Wallet Payment' : 'Add Payment'}
            </Button>
          </div>
        </Tabs>

        {/* Added Payments List */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Added Payments</Label>
            <div className="space-y-2">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={getPaymentColor(payment.method)}>
                        {getPaymentIcon(payment.method)}
                      </div>
                      <div>
                        <p className="font-medium">₹{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                          {payment.details && ` - ${payment.details}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePayment(payment.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Invoice Delivery Options */}
        <Card className="bg-muted/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Invoice Delivery Options</Label>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Select how you'd like to send the invoice to customer ({customerPhone})
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDeliveryOptions.includes('print') 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => toggleDeliveryOption('print')}
                >
                  <CardContent className="p-4 text-center">
                    <Printer className={`h-6 w-6 mx-auto mb-2 ${
                      selectedDeliveryOptions.includes('print') ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-sm font-medium">Print Invoice</p>
                    <p className="text-xs text-muted-foreground">Physical receipt</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDeliveryOptions.includes('whatsapp') 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => toggleDeliveryOption('whatsapp')}
                >
                  <CardContent className="p-4 text-center">
                    <MessageCircle className={`h-6 w-6 mx-auto mb-2 ${
                      selectedDeliveryOptions.includes('whatsapp') ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Send via chat</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDeliveryOptions.includes('sms') 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => toggleDeliveryOption('sms')}
                >
                  <CardContent className="p-4 text-center">
                    <MessageSquare className={`h-6 w-6 mx-auto mb-2 ${
                      selectedDeliveryOptions.includes('sms') ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-sm font-medium">SMS</p>
                    <p className="text-xs text-muted-foreground">Text message</p>
                  </CardContent>
                </Card>
              </div>

              {selectedDeliveryOptions.length > 0 && (
                <div className="p-3 bg-success/5 rounded-lg">
                  <p className="text-sm font-medium text-success">
                    Selected: {selectedDeliveryOptions.map(opt => 
                      opt.charAt(0).toUpperCase() + opt.slice(1)
                    ).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invoice will be delivered via selected methods after payment confirmation
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={confirmPayment}
            disabled={remainingBalance > 0}
            className="flex-1"
          >
            {remainingBalance > 0 ? `₹${remainingBalance} Remaining` : 'Confirm Payment ✓'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;