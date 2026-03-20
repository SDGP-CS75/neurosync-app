import React, { useState, useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Portal, Dialog, Button } from "react-native-paper";
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
                <View
                    style={[
                        styles.inputWrap,
                        {
                            backgroundColor: theme.colors.surfaceVariant,
                            borderColor: theme.colors.outline,
                        },
                    ]}
                >
                    <TextInput
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.textMuted}
                        value={text}
                        onChangeText={(value) => setText(value)}
                        autoFocus
                        selectionColor={theme.colors.primary}
                        style={[
                            styles.input,
                            {
                                color: theme.colors.text,
                            },
                        ]}
                    />
                </View>
            </Dialog.Content>

            <Dialog.Actions>
                <Button textColor={theme.colors.textMuted} onPress={hideDialog}>Cancel</Button>
                <Button textColor={theme.colors.primary} onPress={handleSubmit}>Submit</Button>
            </Dialog.Actions>

            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    inputWrap: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    input: {
        minHeight: 44,
        fontSize: 16,
    },
});

export default InputDialog;
