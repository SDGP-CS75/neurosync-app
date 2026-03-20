import React, { useState, useEffect } from "react";
import { Portal, Dialog, Button, TextInput } from "react-native-paper";
import { useAppTheme } from "../context/ThemeContext";

interface InputDialogProps {
  visible: boolean;
  hideDialog: () => void;
  title: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  initialValue?: string;
}

const InputDialog: React.FC<InputDialogProps> = ({
    visible,
    hideDialog,
    title,
    placeholder,
    onSubmit,
    initialValue = "",
}) => {
    const { theme } = useAppTheme();

    const [text, setText] = useState<string>(initialValue);

    // Reset text when dialog opens with a new initial value
    useEffect(() => {
        if (visible) {
            setText(initialValue);
        }
    }, [visible, initialValue]);

    const handleSubmit = () => {
        onSubmit(text);
        setText("");
        hideDialog();
    };

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={hideDialog}
                style={{ backgroundColor: theme.colors.surface }}
            >
            
            <Dialog.Title style={{ color: theme.colors.textMuted }}>{title}</Dialog.Title>

            <Dialog.Content>
                <TextInput
                    placeholder={placeholder}
                    value={text}
                    onChangeText={setText}
                    mode="outlined"
                    autoFocus
                    textColor={theme.colors.text}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    style={{
                        backgroundColor: theme.colors.surface,
                    }}
                />
            </Dialog.Content>

            <Dialog.Actions>
                <Button textColor={theme.colors.textMuted} onPress={hideDialog}>Cancel</Button>
                <Button textColor={theme.colors.primary} onPress={handleSubmit}>Submit</Button>
            </Dialog.Actions>

            </Dialog>
        </Portal>
    );
};

export default InputDialog;
