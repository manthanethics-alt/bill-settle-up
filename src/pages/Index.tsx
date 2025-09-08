import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, CreditCard, ShoppingCart } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

interface Payment {
  id: string;
  method: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  details?: string;
}

const Index = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedPayments, setCompletedPayments] = useState<Payment[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState({
    id: 'INV-2024-001',
    items: [
      { name: 'Premium Coffee Beans', price: 450, quantity: 2 },
      { name: 'Ceramic Mug', price: 250, quantity: 1 },
      { name: 'Coffee Grinder', price: 1200, quantity: 1 },
    ],
    tax: 95,
    discount: 50
  });

  const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + currentInvoice.tax - currentInvoice.discount;

  const handlePaymentComplete = (payments: Payment[]) => {
    setCompletedPayments(payments);
    setIsPaymentModalOpen(false);
  };

  const handleNewTransaction = () => {
    setCompletedPayments([]);
    setCurrentInvoice({
      ...currentInvoice,
      id: `INV-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Payment Processing System</h1>
          <p className="text-lg text-muted-foreground">
            Professional multi-method payment interface for retail and service businesses
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice {currentInvoice.id}
              </CardTitle>
              <Badge variant="outline">Pending Payment</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {currentInvoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{currentInvoice.tax}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span>-₹{currentInvoice.discount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <Button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full"
                size="lg"
                disabled={completedPayments.length > 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </CardContent>
          </Card>

          {/* Payment Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No payments processed yet</p>
                  <p className="text-sm">Click "Process Payment" to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    Payment Completed ✓
                  </Badge>
                  
                  <div className="space-y-2">
                    <p className="font-semibold">Payment Methods Used:</p>
                    {completedPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium capitalize">{payment.method}</span>
                          {payment.details && (
                            <span className="text-sm text-muted-foreground ml-2">
                              - {payment.details}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">₹{payment.amount}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total Paid:</span>
                      <span className="text-success">
                        ₹{completedPayments.reduce((sum, p) => sum + p.amount, 0)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleNewTransaction}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    New Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Payment System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="h-12 w-12 mx-auto mb-2 bg-payment-cash/20 rounded-full flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-payment-cash" />
                </div>
                <h3 className="font-semibold mb-1">Multi-Method</h3>
                <p className="text-sm text-muted-foreground">Cash, Card, UPI & Wallet payments</p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="h-12 w-12 mx-auto mb-2 bg-payment-card/20 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-payment-card" />
                </div>
                <h3 className="font-semibold mb-1">Split Payments</h3>
                <p className="text-sm text-muted-foreground">Pay using multiple methods</p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="h-12 w-12 mx-auto mb-2 bg-payment-upi/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-payment-upi" />
                </div>
                <h3 className="font-semibold mb-1">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">Live balance calculations</p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="h-12 w-12 mx-auto mb-2 bg-payment-wallet/20 rounded-full flex items-center justify-center">
                  <Badge className="h-6 w-6 text-payment-wallet bg-transparent border-payment-wallet" />
                </div>
                <h3 className="font-semibold mb-1">Validation</h3>
                <p className="text-sm text-muted-foreground">Smart error handling</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={totalAmount}
          onPaymentComplete={handlePaymentComplete}
          walletBalance={{
            total: 350,
            rewardPoints: 150,
            refundBalance: 200
          }}
          customerPhone="+91 98765 43210"
          invoiceNumber={currentInvoice.id}
        />
      </div>
    </div>
  );
};

export default Index;